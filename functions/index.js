const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * ZeePrep Firebase Cloud Function for Secure Gemini AI Execution
 * Secret API key is resolved from process.env.GEMINI_API_KEY or Firebase functions config.
 */
exports.generateGeminiAi = functions.https.onCall(async (data, context) => {
  // 1. Enforce Authentication Guard
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required to access ZeePrep Cloud AI Services."
    );
  }

  const { taskType, prompt, extraContext } = data || {};
  if (!prompt || typeof prompt !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing or invalid prompt string."
    );
  }

  // 2. Secret Key Resolution (Server-Side Only - Never Exposed to APK)
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (functions.config().gemini && functions.config().gemini.key) ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914";

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Gemini API Secret Key is not configured on Firebase Cloud Functions."
    );
  }

  const modelEndpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  ];

  for (const endpoint of modelEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const outputText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return {
            success: true,
            taskType: taskType || "general",
            resultText: outputText.trim(),
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn("Gemini Cloud Function fetch attempt failed:", err);
    }
  }

  throw new functions.https.HttpsError(
    "unavailable",
    "Gemini AI Service is temporarily unavailable on Cloud Functions."
  );
});

/**
 * Public HTTP Endpoint for Mobile Client Web Fallback / REST Invocation
 */
exports.apiGenerateGemini = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { prompt, taskType } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt parameter" });
      return;
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      (functions.config().gemini && functions.config().gemini.key) ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
      res.status(200).json({ success: true, taskType, resultText: outputText });
      return;
    }

    res.status(500).json({ error: "Gemini API error from Cloud Function" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
