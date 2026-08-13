const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ======================================================
// FICHIERS DU SITE
// ======================================================

const ROOT_DIR = path.join(__dirname, "..");

app.use(express.static(ROOT_DIR));

// ======================================================
// ROUTE DE TEST DU SERVEUR
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    name: "LOX BACKEND",
    status: "online",
    gemini: GEMINI_API_KEY ? "configured" : "not configured",
    model: GEMINI_MODEL
  });
});

// ======================================================
// ROUTE GEMINI
// ======================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};

    // Vérification du message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Le message est obligatoire."
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        error: "Le message ne peut pas être vide."
      });
    }

    // Vérification de la clé
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY absente.");

      return res.status(500).json({
        success: false,
        error: "La clé Gemini n'est pas configurée sur le serveur."
      });
    }

    console.log("======================================");
    console.log("📩 Nouvelle demande Gemini");
    console.log("🤖 Modèle :", GEMINI_MODEL);
    console.log("📝 Message :", cleanMessage.slice(0, 200));
    console.log("======================================");

    // ==================================================
    // APPEL DIRECT À L'API GEMINI
    // ==================================================

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${GEMINI_MODEL}:generateContent`;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    let geminiResponse;

    try {
      geminiResponse = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: cleanMessage
                }
              ]
            }
          ]
        }),

        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    // Lire la réponse même en cas d'erreur
    const responseText = await geminiResponse.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Réponse Gemini non JSON :", responseText);

      return res.status(502).json({
        success: false,
        error: "Gemini a retourné une réponse invalide."
      });
    }

    // ==================================================
    // ERREUR GEMINI
    // ==================================================

    if (!geminiResponse.ok) {
      console.error("======================================");
      console.error("❌ ERREUR GEMINI");
      console.error("HTTP :", geminiResponse.status);
      console.error("Réponse :", JSON.stringify(data, null, 2));
      console.error("======================================");

      const geminiMessage =
        data?.error?.message ||
        "Gemini a refusé la requête.";

      return res.status(502).json({
        success: false,
        error: geminiMessage,
        geminiStatus: geminiResponse.status
      });
    }

    // ==================================================
    // EXTRACTION DU TEXTE
    // ==================================================

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      console.error(
        "❌ Gemini n'a fourni aucun texte.",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        success: false,
        error: "Gemini n'a fourni aucune réponse."
      });
    }

    console.log("✅ Réponse Gemini reçue.");
    console.log("📤 Réponse :", reply.slice(0, 300));

    return res.json({
      success: true,
      reply,
      model: GEMINI_MODEL
    });

  } catch (error) {
    console.error("======================================");
    console.error("❌ ERREUR SERVEUR / GEMINI");
    console.error("Nom :", error?.name);
    console.error("Message :", error?.message);
    console.error("Stack :", error?.stack);
    console.error("======================================");

    if (error?.name === "AbortError") {
      return res.status(504).json({
        success: false,
        error: "Gemini met trop de temps à répondre."
      });
    }

    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur interne du serveur."
    });
  }
});

// ======================================================
// ROUTE 404 API
// ======================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route API introuvable."
  });
});

// ======================================================
// DÉMARRAGE
// ======================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(`🚀 LOX fonctionne sur le port ${PORT}`);
  console.log(`🤖 Modèle Gemini : ${GEMINI_MODEL}`);
  console.log(
    `🔐 Gemini API : ${GEMINI_API_KEY ? "configurée" : "ABSENTE"}`
  );
  console.log("======================================");
});
