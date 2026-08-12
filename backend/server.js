const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

/*
========================================
        LOX LABS - BACKEND
========================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "LOX BACKEND",
    version: "1.0.0",
    status: "online",
    ai: GEMINI_API_KEY ? "configured" : "not configured"
  });
});

/*
========================================
        ROUTE GEMINI
========================================
*/

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Le message est obligatoire."
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY n'est pas configurée sur le serveur."
      });
    }

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: message
    });

    res.json({
      success: true,
      reply: response.text
    });

  } catch (error) {
    console.error("Erreur Gemini :", error);

    res.status(500).json({
      success: false,
      error: "Erreur lors de la communication avec Gemini."
    });
  }
});

/*
========================================
        DEMARRAGE DU SERVEUR
========================================
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 LOX fonctionne sur le port ${PORT}`);
  console.log(`🤖 Modèle Gemini : ${GEMINI_MODEL}`);
});
