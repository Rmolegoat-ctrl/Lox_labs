const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Nouveau modèle Google pour les nouveaux utilisateurs
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// =====================================================
// FICHIERS FRONTEND
// =====================================================

const ROOT_DIR = path.join(__dirname, "..");

app.use(express.static(ROOT_DIR));

// =====================================================
// ROUTE RACINE
// =====================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    name: "LOX BACKEND",
    version: "1.0.1",
    status: "online",
    gemini: GEMINI_API_KEY ? "configured" : "not configured",
    model: GEMINI_MODEL
  });
});

// =====================================================
// ROUTE GEMINI
// =====================================================

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

    // Vérification de la clé API
    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY absente.");

      return res.status(500).json({
        success: false,
        error: "La clé Gemini n'est pas configurée sur le serveur."
      });
    }

    console.log("======================================");
    console.log("📩 DEMANDE LOX PRIME");
    console.log("🤖 Modèle :", GEMINI_MODEL);
    console.log("📝 Message :", cleanMessage.slice(0, 200));
    console.log("======================================");

    // =================================================
    // CLIENT GEMINI
    // =================================================

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    // =================================================
    // APPEL GEMINI
    // =================================================

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: cleanMessage
    });

    const reply = response.text;

    // =================================================
    // VÉRIFICATION DE LA RÉPONSE
    // =================================================

    if (!reply || typeof reply !== "string") {
      console.error("❌ Gemini n'a fourni aucun texte.");

      return res.status(502).json({
        success: false,
        error: "Gemini n'a fourni aucune réponse."
      });
    }

    console.log("✅ Réponse Gemini reçue.");
    console.log("📤 Réponse :", reply.slice(0, 300));

    return res.json({
      success: true,
      reply: reply,
      model: GEMINI_MODEL
    });

  } catch (error) {

    console.error("======================================");
    console.error("❌ ERREUR GEMINI");
    console.error("Nom :", error?.name);
    console.error("Message :", error?.message);
    console.error("Status :", error?.status);
    console.error("Code :", error?.code);
    console.error("======================================");

    return res.status(502).json({
      success: false,
      error: error?.message || "Erreur lors de la communication avec Gemini."
    });
  }
});

// =====================================================
// ROUTE API INEXISTANTE
// =====================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route API introuvable."
  });
});

// =====================================================
// DÉMARRAGE
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(`🚀 LOX fonctionne sur le port ${PORT}`);
  console.log(`🤖 Modèle Gemini : ${GEMINI_MODEL}`);
  console.log(
    `🔐 Gemini API : ${GEMINI_API_KEY ? "configurée" : "ABSENTE"}`
  );
  console.log("======================================");
});
