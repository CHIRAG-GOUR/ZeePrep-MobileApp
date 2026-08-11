const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// SMTP Transporter for ZeePrep Email Service
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "pa1@skillizee.io",
    pass: "ecbecpdtvytsqsme",
  },
  headers: {
    "X-Mailer": "ZeePrep LMS Email Dispatcher v4.0",
    "X-Auto-Response-Suppress": "All",
  },
});

// ═══════════════════════════════════════════════════════════════════════
// 1. sendEmail Cloud Function (Preserves Web & Mobile Email Dispatch)
// ═══════════════════════════════════════════════════════════════════════
exports.sendEmail = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).send("");

  const { to, subject, text, html } = req.body || {};
  if (!to || !subject) {
    return res.status(400).json({ error: "Missing required 'to' or 'subject' field" });
  }

  const recipient = Array.isArray(to) ? to.join(",") : String(to).trim();

  try {
    const mailOptions = {
      from: '"ZeePrep LMS Portal" <pa1@skillizee.io>',
      replyTo: "pa1@skillizee.io",
      to: recipient,
      subject: subject,
      text: text || "ZeePrep LMS Notification",
      html: html || `<p>${text || "ZeePrep LMS Notification"}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("[sendEmail] SMTP Error:", err);
    return res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 2. deleteUserAccount Cloud Function (Preserves Web & Mobile User Deletion)
// ═══════════════════════════════════════════════════════════════════════
exports.deleteUserAccount = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).send("");

  const { uid, loginId } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: "Missing required 'uid' field" });
  }

  try {
    console.log(`[deleteUserAccount] Deleting user ${uid} from Auth & Firestore...`);

    try {
      await admin.auth().deleteUser(uid);
    } catch (authErr) {
      if (authErr.code !== "auth/user-not-found") {
        console.error(`[deleteUserAccount] Auth deletion error:`, authErr);
      }
    }

    await db.collection("users").doc(uid).delete();
    if (loginId) {
      await db.collection("loginIds").doc(loginId).delete();
    }

    return res.status(200).json({
      success: true,
      message: `User ${uid} deleted completely from Auth & Firestore.`,
    });
  } catch (err) {
    console.error("[deleteUserAccount] Error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete user account" });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 3. apiGenerateGemini Cloud Function (Unified Gemini AI Endpoint)
// ═══════════════════════════════════════════════════════════════════════
exports.apiGenerateGemini = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).send("");

  try {
    const { prompt, taskType } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt parameter" });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914";

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (outputText) {
            return res.status(200).json({ success: true, taskType: taskType || "general", resultText: outputText.trim() });
          }
        }
      } catch (err) {
        console.warn("[apiGenerateGemini] Endpoint fetch failed:", err);
      }
    }

    return res.status(500).json({ error: "Gemini AI model unavailable" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
