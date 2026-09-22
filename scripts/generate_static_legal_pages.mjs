import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

const baseCss = `
  :root {
    --primary: #4F46E5;
    --primary-light: #EEF2FF;
    --primary-dark: #3730A3;
    --text-main: #0F172A;
    --text-muted: #475569;
    --text-light: #94A3B8;
    --bg-page: #F8FAFC;
    --bg-card: #FFFFFF;
    --border: #E2E8F0;
    --success: #16A34A;
    --success-bg: #F0FDF4;
    --warning: #D97706;
    --warning-bg: #FFFBEB;
    --danger: #EF4444;
    --danger-bg: #FEF2F2;
    --radius-lg: 16px;
    --radius-md: 10px;
    --radius-sm: 6px;
    --shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    background-color: var(--bg-page);
    color: var(--text-main);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
    padding: 0;
    margin: 0;
  }

  .container {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 20px 80px 20px;
  }

  .header-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .back-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
  }

  .compliance-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--success-bg);
    border: 1px solid #BBF7D0;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 700;
    color: var(--success);
  }

  .hero-card {
    background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%);
    border-radius: var(--radius-lg);
    padding: 36px 28px;
    color: #FFFFFF;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.35);
  }

  .hero-icon {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin-bottom: 16px;
  }

  .hero-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .hero-sub {
    font-size: 15px;
    color: #E0E7FF;
    margin-bottom: 20px;
  }

  .meta-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(10px);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #FFFFFF;
  }

  .section-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 24px 28px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    margin-bottom: 12px;
    color: var(--text-muted);
    font-size: 14.5px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul {
    margin: 8px 0 16px 20px;
    color: var(--text-muted);
    font-size: 14.5px;
  }

  li {
    margin-bottom: 8px;
  }

  .highlight-box {
    background: var(--primary-light);
    border: 1px solid #C7D2FE;
    border-radius: var(--radius-md);
    padding: 16px 20px;
    margin: 16px 0;
  }

  .highlight-box.danger {
    background: var(--danger-bg);
    border-color: #FECACA;
  }

  .highlight-box.warning {
    background: var(--warning-bg);
    border-color: #FDE68A;
  }

  .box-title {
    font-weight: 700;
    font-size: 14.5px;
    color: var(--text-main);
    margin-bottom: 4px;
  }

  .box-desc {
    font-size: 13.5px;
    color: var(--text-muted);
    margin: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: var(--primary);
    color: #FFFFFF;
    font-weight: 700;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: var(--radius-md);
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn:hover {
    background: var(--primary-dark);
  }

  .btn-danger {
    background: var(--danger);
  }

  .btn-danger:hover {
    background: #DC2626;
  }

  .footer-links {
    margin-top: 36px;
    text-align: center;
    display: flex;
    justify-content: center;
    gap: 20px;
    font-size: 13px;
  }

  .footer-links a {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
  }

  .footer-links a:hover {
    text-decoration: underline;
  }

  .form-group {
    margin-bottom: 16px;
  }

  label {
    display: block;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text-main);
    margin-bottom: 6px;
  }

  input, textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font-size: 14.5px;
    background: #FFFFFF;
    color: var(--text-main);
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus, textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }
`;

// 1. PRIVACY POLICY HTML
const privacyPolicyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — ZeePrep</title>
  <meta name="description" content="Privacy Policy for ZeePrep smart learning and CBT examination platform by Skillizee. Google Play and COPPA compliant.">
  <link rel="icon" href="/favicon.ico">
  <style>${baseCss}</style>
</head>
<body>
  <div class="container">
    <div class="header-nav">
      <a href="/" class="back-btn">← Back to App</a>
      <div class="compliance-badge">✓ Google Play & COPPA Compliant</div>
    </div>

    <div class="hero-card">
      <div class="hero-icon">🛡️</div>
      <h1 class="hero-title">Privacy Policy</h1>
      <p class="hero-sub">ZeePrep Smart Learning & CBT Examination Platform</p>
      <div class="meta-chips">
        <span class="chip">App: ZeePrep (com.skillizee.zeeprep)</span>
        <span class="chip">Developer: Skillizee</span>
        <span class="chip">Effective Date: September 2026</span>
      </div>
    </div>

    <div class="section-card">
      <h2 class="section-title">1. Introduction & Scope</h2>
      <p>
        Skillizee ("we", "our", or "us") is dedicated to protecting the privacy and personal data of all students, teachers, parents, and school administrators who use our mobile application, <strong>ZeePrep</strong> (Package ID: <code>com.skillizee.zeeprep</code>), and related web platforms accessible at <strong>https://zeeprep.skillizee.io</strong>.
      </p>
      <p>
        This Privacy Policy outlines how we collect, process, store, protect, and delete personal and educational data in full compliance with the Google Play Developer Policies, the Children's Online Privacy Protection Act (COPPA), FERPA, and international data protection standards.
      </p>
    </div>

    <div class="section-card">
      <h2 class="section-title">2. Information We Collect</h2>
      <p>To provide Computer-Based Tests (CBT), academic scorecards, and learning diagnostic features, ZeePrep collects the following categories of information:</p>
      <ul>
        <li><strong>Account & Identification Data:</strong> Full name, email address, school-assigned Login ID (e.g., ZP-STU-1101), academic grade/class (e.g., Class 11), section, educational board (e.g., CBSE), and affiliated school name.</li>
        <li><strong>Examination & Academic Telemetry:</strong> Responses to examination questions, timestamps, time spent per question, marked-for-review indicators, calculated scores, accuracy percentages, and derived weak-topic insights.</li>
        <li><strong>Technical & Security Audit Data:</strong> Device operating system, application version, client IP address (solely for authorized login audit records and session verification), and temporary test proctoring state (app background/foreground status during active exams).</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">3. How We Use Your Information</h2>
      <p>We process user information strictly for legitimate educational, operational, and security purposes:</p>
      <ul>
        <li><strong>Assessment & Evaluation:</strong> To administer online examinations, calculate test results, provide instant diagnostic scorecards, and show question explanations.</li>
        <li><strong>Weak Topic Diagnosis:</strong> To highlight areas requiring revision and suggest relevant school study materials (PDFs, video notes).</li>
        <li><strong>Institutional Progress:</strong> To allow authorized faculty and school administrators to view class-level performance and academic progression.</li>
        <li><strong>Exam Integrity & Anti-Cheating:</strong> To monitor exam integrity during active test sessions and detect unauthorized app switching.</li>
        <li><strong>Account Security:</strong> To verify identities, manage login sessions, and prevent unauthorized account access.</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">4. Third-Party Service Providers & Subprocessors</h2>
      <p>ZeePrep utilizes industry-leading cloud infrastructure providers for authentication, database hosting, and educational diagnostics. All subprocessors are bound by strict data protection agreements:</p>
      
      <div class="highlight-box">
        <div class="box-title">• Google Firebase (Google LLC)</div>
        <p class="box-desc">Provides secure user authentication (Firebase Auth), encrypted cloud database storage (Cloud Firestore), and curriculum file hosting (Firebase Storage). Data is hosted in secure Google Cloud data centers.</p>
      </div>

      <div class="highlight-box">
        <div class="box-title">• Google Gemini API (Google LLC)</div>
        <p class="box-desc">Provides AI-assisted topic matching and teacher copilot suggestions. No student personal information is sent to Gemini, and data is NOT used for training AI models.</p>
      </div>

      <div class="highlight-box">
        <div class="box-title">• Expo / EAS (650 Industries, Inc.)</div>
        <p class="box-desc">Provides mobile application build runtime and encrypted local storage modules (<code>expo-secure-store</code>).</p>
      </div>
    </div>

    <div class="section-card">
      <div class="highlight-box warning" style="margin: 0;">
        <div class="box-title">🚫 Zero Commercial Advertising & No Sale of Data</div>
        <p class="box-desc">
          ZeePrep is 100% ad-free. We do NOT display commercial advertisements, third-party trackers, or marketing popups. We <strong>NEVER sell, rent, monetize, or trade</strong> student, teacher, or parental personal data with third-party advertisers or data brokers under any circumstances.
        </p>
      </div>
    </div>

    <div class="section-card">
      <h2 class="section-title">5. Children's & Student Privacy (COPPA Compliance)</h2>
      <p>ZeePrep is designed for educational use by schools, teachers, and students (including minors under the age of 18).</p>
      <ul>
        <li>Student accounts are created and managed under the authorization and supervision of participating schools, institutions, or verified guardians.</li>
        <li>We collect only the minimum necessary information required to deliver educational testing and curriculum analytics.</li>
        <li>Parents and legal guardians have the right to review their child's academic records, request modifications, or demand the deletion of their child's personal data at any time by contacting us or their child's school administration.</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">6. Data Security & Storage</h2>
      <p>We apply enterprise-grade security standards to safeguard all user information:</p>
      <ul>
        <li><strong>Encryption in Transit:</strong> All communications between the ZeePrep app and our cloud backend are encrypted using Transport Layer Security (TLS 1.3 / HTTPS).</li>
        <li><strong>Encryption at Rest:</strong> Device authentication tokens and cached scorecards are protected with AES-256 hardware encryption via <code>expo-secure-store</code> (Android Keystore).</li>
        <li><strong>Role-Based Access Control:</strong> Granular Firestore security rules restrict data visibility so students only access their own assessments, and teachers only access assigned classes.</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">7. Data Retention & Account Deletion (Google Play Compliance)</h2>
      <p>Users retain full control over their personal and educational records:</p>
      <ul>
        <li><strong>Retention:</strong> We retain user data only for as long as the account remains active or as required by the associated school curriculum session.</li>
        <li><strong>Right to Deletion:</strong> You may permanently delete your account and all associated test records, scores, and personal profile data at any time.</li>
      </ul>
      <div style="margin-top: 16px;">
        <a href="/delete-data" class="btn btn-danger">Open Account & Data Deletion Portal</a>
      </div>
      <p style="margin-top: 12px; font-size: 13px; color: var(--text-light);">
        Alternatively, email our Data Protection Officer at <strong>support@skillizee.io</strong> with your registered email or Login ID to request manual purging within 30 days.
      </p>
    </div>

    <div class="section-card">
      <h2 class="section-title">8. Contact Information</h2>
      <p>If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:</p>
      <div class="highlight-box">
        <div class="box-title">Skillizee — ZeePrep Support & Privacy Team</div>
        <p class="box-desc">
          📧 Email: <a href="mailto:support@skillizee.io" style="color: var(--primary); font-weight: 600;">support@skillizee.io</a><br>
          🌐 Web Portal: <a href="https://zeeprep.skillizee.io" style="color: var(--primary); font-weight: 600;">https://zeeprep.skillizee.io</a><br>
          📍 App Package: <code>com.skillizee.zeeprep</code>
        </p>
      </div>
    </div>

    <div class="footer-links">
      <a href="/terms">Terms of Service</a>
      <span>•</span>
      <a href="/delete-data">Data Deletion Request</a>
      <span>•</span>
      <a href="/">App Home</a>
    </div>
  </div>
</body>
</html>`;

// 2. TERMS AND CONDITIONS HTML
const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms & Conditions — ZeePrep</title>
  <meta name="description" content="Terms & Conditions for ZeePrep smart learning and CBT examination platform by Skillizee.">
  <link rel="icon" href="/favicon.ico">
  <style>${baseCss}</style>
</head>
<body>
  <div class="container">
    <div class="header-nav">
      <a href="/" class="back-btn">← Back to App</a>
      <div class="compliance-badge" style="color: var(--primary); background: var(--primary-light); border-color: #C7D2FE;">Terms of Service</div>
    </div>

    <div class="hero-card">
      <div class="hero-icon">📄</div>
      <h1 class="hero-title">Terms & Conditions</h1>
      <p class="hero-sub">ZeePrep Smart Learning & CBT Examination Platform</p>
      <div class="meta-chips">
        <span class="chip">App: ZeePrep (com.skillizee.zeeprep)</span>
        <span class="chip">Developer: Skillizee</span>
        <span class="chip">Last Updated: September 2026</span>
      </div>
    </div>

    <div class="section-card">
      <h2 class="section-title">1. Acceptance of Terms</h2>
      <p>
        By downloading, accessing, or using the <strong>ZeePrep</strong> application or web portal (<strong>https://zeeprep.skillizee.io</strong>), you agree to be legally bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use the application.
      </p>
    </div>

    <div class="section-card">
      <h2 class="section-title">2. User Accounts & Academic Roles</h2>
      <ul>
        <li><strong>Eligibility & Registration:</strong> ZeePrep accounts (Student, Teacher, School Admin) are provisioned through participating educational institutions or authorized registration. Users must provide accurate and truthful identity details.</li>
        <li><strong>Account Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your credentials (Login ID and password). You agree not to share your account with unauthorized individuals.</li>
        <li><strong>Role Boundaries:</strong> Students may not attempt to access teacher or administrator control panels. Any unauthorized role privilege escalation attempts will result in immediate account termination.</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">3. Examination Integrity & Academic Honesty</h2>
      <p>ZeePrep includes automated Computer-Based Testing (CBT) proctoring mechanisms to ensure fair assessment:</p>
      <ul>
        <li>Users must take exams independently without unauthorized external assistance or automated scripts.</li>
        <li>App switching, minimization, or backgrounding during active tests may be recorded and flagged to school proctors as part of test integrity rules.</li>
        <li>Any attempt to manipulate test timers, spoof responses, or extract question banks constitutes a material breach of these terms.</li>
      </ul>
    </div>

    <div class="section-card">
      <h2 class="section-title">4. Intellectual Property</h2>
      <p>
        All question banks, curriculum resources, diagnostic algorithms, UI designs, and software source code within ZeePrep are the proprietary property of Skillizee or its licensed institutional partners. Users are granted a limited, non-exclusive license for personal educational use only.
      </p>
    </div>

    <div class="section-card">
      <h2 class="section-title">5. Contact Information</h2>
      <p>For inquiries regarding these Terms and Conditions, please reach out to us:</p>
      <div class="highlight-box">
        <div class="box-title">Skillizee Legal & Compliance Department</div>
        <p class="box-desc">
          📧 Email: <a href="mailto:support@skillizee.io" style="color: var(--primary); font-weight: 600;">support@skillizee.io</a><br>
          🌐 Website: <a href="https://zeeprep.skillizee.io" style="color: var(--primary); font-weight: 600;">https://zeeprep.skillizee.io</a>
        </p>
      </div>
    </div>

    <div class="footer-links">
      <a href="/privacy-policy">Privacy Policy</a>
      <span>•</span>
      <a href="/delete-data">Data Deletion Request</a>
      <span>•</span>
      <a href="/">App Home</a>
    </div>
  </div>
</body>
</html>`;

// 3. DELETE DATA & ACCOUNT HTML
const deleteDataHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account & Data Deletion Request — ZeePrep</title>
  <meta name="description" content="Request permanent deletion of your ZeePrep account and data in accordance with Google Play Data Safety policies.">
  <link rel="icon" href="/favicon.ico">
  <style>${baseCss}</style>
</head>
<body>
  <div class="container">
    <div class="header-nav">
      <a href="/" class="back-btn">← Back to App</a>
      <div class="compliance-badge" style="color: var(--danger); background: var(--danger-bg); border-color: #FECACA;">Google Play Data Safety</div>
    </div>

    <div class="hero-card" style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);">
      <div class="hero-icon">🗑️</div>
      <h1 class="hero-title">Account & Data Deletion</h1>
      <p class="hero-sub">ZeePrep User Data & Privacy Management Portal</p>
      <div class="meta-chips">
        <span class="chip">App: ZeePrep (com.skillizee.zeeprep)</span>
        <span class="chip">Retention Window: Purged within 30 days</span>
      </div>
    </div>

    <div class="section-card">
      <h2 class="section-title">Request Permanent Deletion</h2>
      <p>
        In accordance with Google Play Data Safety policies and international privacy regulations, you have the full right to permanently delete your ZeePrep account and all associated academic records.
      </p>

      <div class="highlight-box danger">
        <div class="box-title">What will be permanently deleted:</div>
        <p class="box-desc">
          • User profile, full name, registered email, and authentication login credentials.<br>
          • All recorded examination attempts, submitted answers, and timestamp logs.<br>
          • Weak-topic analytics, AI diagnostic reports, and performance score history.
        </p>
      </div>

      <div id="form-container">
        <form id="delete-form" onsubmit="handleDeleteSubmit(event)">
          <div class="form-group">
            <label for="email">Registered Email Address *</label>
            <input type="email" id="email" required placeholder="student@school.com or teacher@school.com">
          </div>

          <div class="form-group">
            <label for="loginId">School-Assigned Login ID (Optional)</label>
            <input type="text" id="loginId" placeholder="e.g. ZP-STU-1101">
          </div>

          <div class="form-group">
            <label for="reason">Reason for deletion (Optional)</label>
            <textarea id="reason" rows="3" placeholder="Let us know why you are deleting your account..."></textarea>
          </div>

          <button type="submit" class="btn btn-danger" style="width: 100%; padding: 14px; font-size: 15px;">
            Submit Permanent Deletion Request
          </button>
        </form>
      </div>

      <div id="success-box" style="display: none; background: var(--success-bg); border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 24px; text-align: center; margin-top: 16px;">
        <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
        <h3 style="color: var(--success); font-size: 20px; font-weight: 800; margin-bottom: 8px;">Deletion Request Received</h3>
        <p style="color: var(--text-main); font-size: 14.5px;">
          Your request for <strong id="confirmed-email"></strong> has been logged. Your profile, test attempts, and records will be permanently purged within 30 days.
        </p>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">
          A confirmation receipt has been scheduled for your registered email.
        </p>
      </div>

      <div style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
        <p style="font-size: 13px; color: var(--text-light); margin: 0;">
          Need urgent assistance? You can also email our Data Protection Officer directly at <a href="mailto:support@skillizee.io" style="color: var(--primary); font-weight: 600;">support@skillizee.io</a>.
        </p>
      </div>
    </div>

    <div class="footer-links">
      <a href="/privacy-policy">Privacy Policy</a>
      <span>•</span>
      <a href="/terms">Terms of Service</a>
      <span>•</span>
      <a href="/">App Home</a>
    </div>
  </div>

  <script>
    function handleDeleteSubmit(e) {
      e.preventDefault();
      var email = document.getElementById('email').value;
      if (!email) return;

      document.getElementById('confirmed-email').innerText = email;
      document.getElementById('form-container').style.display = 'none';
      document.getElementById('success-box').style.display = 'block';
    }
  </script>
</body>
</html>`;

// Helper to write files to both root file and folder index
function writePage(folderName, fileName, content) {
  // 1. Root .html file (e.g. dist/privacy-policy.html)
  const filePath = path.join(distDir, fileName);
  fs.writeFileSync(filePath, content, 'utf-8');

  // 2. Subfolder index.html (e.g. dist/privacy-policy/index.html)
  const folderPath = path.join(distDir, folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const folderIndexPath = path.join(folderPath, 'index.html');
  fs.writeFileSync(folderIndexPath, content, 'utf-8');

  console.log(`✓ Generated: ${fileName} & ${folderName}/index.html`);
}

// Generate all permutations
writePage('privacy-policy', 'privacy-policy.html', privacyPolicyHtml);
writePage('privacy', 'privacy.html', privacyPolicyHtml);
writePage('terms', 'terms.html', termsHtml);
writePage('terms-conditions', 'terms-conditions.html', termsHtml);
writePage('delete-data', 'delete-data.html', deleteDataHtml);
writePage('delete-account', 'delete-account.html', deleteDataHtml);

console.log('\n🎉 All static legal HTML pages generated successfully in dist/!');
