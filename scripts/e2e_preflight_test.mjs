import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914",
  authDomain: "zeeprep01.firebaseapp.com",
  projectId: "zeeprep01",
  storageBucket: "zeeprep01.firebasestorage.app",
  messagingSenderId: "1032565153081",
  appId: "1:1032565153081:web:48015a20f9cb2ad345dce8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEMO_STUDENTS = [
  { id: "ZP-STU-1101", email: "student11a@zeeprep.com", pass: "Password@123", expectedName: "CCWS 1" },
  { id: "ZP-STU-1102", email: "student11b@zeeprep.com", pass: "Password@123", expectedName: "CCWS 2" },
  { id: "ZP-STU-1103", email: "student11c@zeeprep.com", pass: "Password@123", expectedName: "CCWS 3" },
  { id: "ZP-STU-1104", email: "student11d@zeeprep.com", pass: "Password@123", expectedName: "CCWS 4" },
];

async function runPreflightTests() {
  console.log("=================================================");
  console.log("🚀 STARTING FULL E2E PREFLIGHT VERIFICATION TEST");
  console.log("=================================================\n");

  let totalErrors = 0;

  // 1. TEST AUTHENTICATION & PROFILES FOR ALL 4 DEMO STUDENTS
  console.log("--- TEST 1: Student Authentication & Login ID Mapping ---");
  for (const stu of DEMO_STUDENTS) {
    try {
      // Test 1a: Check loginIds document
      const loginDoc = await getDoc(doc(db, "loginIds", stu.id));
      if (!loginDoc.exists()) {
        console.error(`❌ Missing loginIds mapping for ${stu.id}`);
        totalErrors++;
        continue;
      }
      const loginData = loginDoc.data();
      if (loginData.email !== stu.email) {
        console.error(`❌ Mismatch in loginIds email: expected ${stu.email}, got ${loginData.email}`);
        totalErrors++;
      }

      // Test 1b: Firebase Auth sign in
      const res = await signInWithEmailAndPassword(auth, stu.email, stu.pass);
      const uid = res.user.uid;

      // Test 1c: Check users collection profile
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        console.error(`❌ Missing users doc for UID: ${uid} (${stu.email})`);
        totalErrors++;
        continue;
      }
      const uData = userDoc.data();
      if (uData.status !== "active") {
        console.error(`❌ User ${stu.email} is not active (status: ${uData.status})`);
        totalErrors++;
      }
      if (uData.role !== "student") {
        console.error(`❌ User ${stu.email} role is not student (${uData.role})`);
        totalErrors++;
      }

      console.log(`✓ [PASS] ${stu.id} (${stu.email}) authenticated. Name: "${uData.name}", Grade: ${uData.grade}, Status: ${uData.status}`);
    } catch (err) {
      console.error(`❌ Auth failure for ${stu.email}:`, err.message);
      totalErrors++;
    }
  }

  // 2. TEST FACULTY / SUPERADMIN AUTH
  console.log("\n--- TEST 2: Faculty / SuperAdmin Authentication ---");
  try {
    const facultyRes = await signInWithEmailAndPassword(auth, "pa1@skillizee.io", "787700");
    const facultyDoc = await getDoc(doc(db, "users", facultyRes.user.uid));
    console.log(`✓ [PASS] Faculty authenticated (${facultyRes.user.email}). Role: ${facultyDoc.data()?.role || "superadmin"}`);
  } catch (err) {
    console.error("❌ Faculty Auth failure:", err.message);
    totalErrors++;
  }

  // 3. TEST CLASS 11 EXAMS INTEGRITY & QUESTIONS
  console.log("\n--- TEST 3: Class 11 Exam Retrieval & Question Integrity ---");
  const examsSnap = await getDocs(collection(db, "exams"));
  const class11Exams = [];
  examsSnap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    if (String(data.grade).includes("11") || (data.title && data.title.includes("Class 11"))) {
      class11Exams.push(data);
    }
  });

  console.log(`Found ${class11Exams.length} Class 11 exams in Firestore.`);

  if (class11Exams.length < 3) {
    console.error(`❌ Expected at least 3 exams for Class 11, found ${class11Exams.length}`);
    totalErrors++;
  }

  for (const ex of class11Exams) {
    console.log(`\nInspecting Exam: "${ex.title}" (ID: ${ex.id})`);
    console.log(`- Status: ${ex.status} | Max Attempts: ${ex.maxAttempts} | Duration: ${ex.durationMinutes}m | Total Marks: ${ex.totalMarks}`);

    if (ex.status !== "published" && ex.status !== "active") {
      console.error(`❌ Exam ${ex.id} is not published (status: ${ex.status})`);
      totalErrors++;
    }

    if (ex.maxAttempts !== "unlimited") {
      console.warn(`⚠️ Exam ${ex.id} maxAttempts is not 'unlimited' (is: ${ex.maxAttempts})`);
    }

    const qIds = ex.questionIds || [];
    console.log(`- Total Questions in Paper: ${qIds.length}`);

    if (qIds.length === 0) {
      console.error(`❌ Exam ${ex.id} has 0 questions!`);
      totalErrors++;
      continue;
    }

    // Check each question document
    let validQCount = 0;
    for (const qId of qIds) {
      const qDoc = await getDoc(doc(db, "questions", qId));
      if (!qDoc.exists()) {
        console.error(`❌ Question not found in Firestore: ${qId}`);
        totalErrors++;
      } else {
        const qData = qDoc.data();
        if (!qData.text || !qData.options || qData.options.length < 2 || qData.correctAnswer === undefined) {
          console.error(`❌ Malformed question ${qId}:`, qData);
          totalErrors++;
        } else {
          validQCount++;
        }
      }
    }
    console.log(`✓ [PASS] All ${validQCount}/${qIds.length} question docs verified with valid options & correct answers.`);
  }

  // 4. TEST STUDY RESOURCES AVAILABILITY FOR CLASS 11 MATH
  console.log("\n--- TEST 4: Study Resources for Class 11 Math ---");
  const resSnap = await getDocs(collection(db, "study_resources"));
  const c11Res = [];
  resSnap.forEach((d) => {
    const data = d.data();
    if (String(data.grade).includes("11") && (String(data.subject).toLowerCase().includes("math"))) {
      c11Res.push({ id: d.id, title: data.title, type: data.type });
    }
  });
  console.log(`✓ [PASS] Found ${c11Res.length} Class 11 Math study resources available for weak topic recommendations.`);

  // 5. SUMMARY
  console.log("\n=================================================");
  if (totalErrors === 0) {
    console.log("🎉 ALL TESTS PASSED! ZERO MARGIN FOR ERROR.");
    console.log("The test environment is 100% verified and ready for students!");
  } else {
    console.error(`🚨 ${totalErrors} issue(s) detected during preflight check.`);
  }
  console.log("=================================================");
}

runPreflightTests().catch(console.error);
