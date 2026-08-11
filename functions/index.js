const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

// Modern Firebase v2 Secret definition (GEMINI_API_KEY)
const geminiApiKeySecret = defineSecret("GEMINI_API_KEY");

/**
 * ZeePrep Firebase Cloud Function v2 for Secure Gemini AI Execution
 * Uses modern Firebase Secret Manager & environment params (v2 API)
 */
exports.generateGeminiAi = onCall(
  { secrets: [geminiApiKeySecret], cors: true },
  async (request) => {
    // 1. Enforce Authentication Guard
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required to access ZeePrep Cloud AI Services."
      );
    }

    const { taskType, prompt } = request.data || {};
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid prompt string."
      );
    }

    // 2. Secret Key Resolution (v2 Secret Manager / process.env)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      geminiApiKeySecret.value() ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new HttpsError(
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

    throw new HttpsError(
      "unavailable",
      "Gemini AI Service is temporarily unavailable on Cloud Functions."
    );
  }
);

/**
 * Public HTTP v2 Endpoint for Mobile Client Web Fallback / REST Invocation
 */
exports.apiGenerateGemini = onRequest(
  { secrets: [geminiApiKeySecret], cors: true },
  async (req, res) => {
    try {
      const { prompt, taskType } = req.body || {};
      if (!prompt) {
        res.status(400).json({ error: "Missing prompt parameter" });
        return;
      }

      const apiKey =
        process.env.GEMINI_API_KEY ||
        geminiApiKeySecret.value() ||
        process.env.EXPO_PUBLIC_GEMINI_API_KEY;

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
  }
);
