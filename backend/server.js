const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/*
==================================================
                 LOX PRIME
              IDENTITÉ DU SYSTÈME
==================================================
*/

const LOX_SYSTEM_INSTRUCTION = `
Tu es LOX PRIME.

Ton nom est LOX PRIME.
Tu es l'assistant IA principal du projet LOX Labs.

IDENTITÉ :
- Tu ne dois pas te présenter comme "Gemini" lorsque l'utilisateur te demande qui tu es.
- Gemini est le moteur IA utilisé par ton système, mais ton identité est LOX PRIME.
- Si on te demande quel moteur tu utilises, tu peux expliquer que ton intelligence est propulsée par une technologie de Google, sans prétendre être le produit Gemini lui-même.
- Tu es un assistant numérique conçu pour aider l'utilisateur, réfléchir avec lui et l'accompagner dans ses projets.

PERSONNALITÉ :
- Tu es chaleureux, intelligent, calme et naturel.
- Tu es respectueux et encourageant.
- Tu peux être enthousiaste lorsque l'utilisateur réussit quelque chose.
- Tu évites les réponses froides ou excessivement robotiques.
- Tu ne prétends jamais être humain.
- Tu ne mens pas sur tes capacités.

LANGUE :
- Réponds dans la langue utilisée par l'utilisateur.
- Si l'utilisateur parle français, réponds naturellement en français.
- Utilise un français clair et moderne.
- Ne change pas inutilement de langue.

COMPORTEMENT :
- Comprends d'abord la demande avant de répondre.
- Donne des réponses utiles et directement exploitables.
- Lorsque plusieurs étapes sont nécessaires, guide l'utilisateur étape par étape.
- Ne demande pas inutilement à l'utilisateur de répéter une information déjà présente dans la conversation.
- Si tu ne sais pas quelque chose, dis-le clairement.
- Ne fabrique jamais une information présentée comme certaine.

PROJET LOX :
- Tu peux aider à construire, améliorer, tester et expliquer le projet LOX Labs.
- Lorsque l'utilisateur travaille sur LOX PRIME, considère que tu participes à la construction de cet assistant.
- Pour les problèmes techniques, analyse l'erreur avant de proposer une modification.
- Ne conseille jamais de supprimer une information importante sans raison.

STYLE :
- Sois naturel.
- Évite les introductions répétitives comme "En tant qu'intelligence artificielle..."
- N'utilise pas de formulations inutilement longues.
- Tu peux utiliser des emojis avec modération lorsque le contexte s'y prête.

IMPORTANT :
Ton identité est LOX PRIME.
Ton moteur IA est un composant technique.
Ne confonds jamais les deux.
`;

/*
==================================================
                    ROUTE TEST
==================================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "LOX PRIME BACKEND",
    version: "1.1.0",
    status: "online",
    ai: GEMINI_API_KEY ? "configured" : "not configured",
    model: GEMINI_MODEL
  });
});

/*
==================================================
                  ROUTE DE SANTÉ
==================================================
*/

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "LOX PRIME",
    status: "healthy",
    ai: GEMINI_API_KEY ? "ready" : "not configured",
    model: GEMINI_MODEL
  });
});

/*
==================================================
                  ROUTE GEMINI
==================================================
*/

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    /*
    ----------------------------------------------
    Vérification du message
    ----------------------------------------------
    */

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Le message est obligatoire."
      });
    }

    /*
    ----------------------------------------------
    Vérification de la clé API
    ----------------------------------------------
    */

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY n'est pas configurée sur le serveur."
      });
    }

    /*
    ----------------------------------------------
    Initialisation du moteur IA
    ----------------------------------------------
    */

    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY
    });

    /*
    ----------------------------------------------
    Construction du contexte
    ----------------------------------------------
    */

    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-20)) {
        if (
          item &&
          typeof item.role === "string" &&
          typeof item.text === "string" &&
          item.text.trim()
        ) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [
              {
                text: item.text.trim()
              }
            ]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: message.trim()
        }
      ]
    });

    /*
    ----------------------------------------------
    Appel du modèle
    ----------------------------------------------
    */

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: LOX_SYSTEM_INSTRUCTION,
        temperature: 0.7
      }
    });

    /*
    ----------------------------------------------
    Récupération de la réponse
    ----------------------------------------------
    */

    const reply = response.text;

    if (!reply || typeof reply !== "string") {
      return res.status(502).json({
        success: false,
        error: "Le moteur IA a retourné une réponse vide."
      });
    }

    /*
    ----------------------------------------------
    Réponse au frontend
    ----------------------------------------------
    */

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
      model: GEMINI_MODEL,
      assistant: "LOX PRIME"
    });

  } catch (error) {
    console.error("Erreur LOX PRIME :", error);

    /*
    ----------------------------------------------
    Gestion des erreurs Gemini
    ----------------------------------------------
    */

    const errorMessage =
      error?.message ||
      error?.error?.message ||
      "Erreur inconnue lors de la communication avec le moteur IA.";

    const status =
      error?.status ||
      error?.error?.code ||
      500;

    return res.status(Number(status) >= 400 && Number(status) < 600 ? Number(status) : 500).json({
      success: false,
      error: errorMessage
    });
  }
});

/*
==================================================
                 DÉMARRAGE SERVEUR
==================================================
*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🧠 LOX PRIME fonctionne sur le port ${PORT}`);
  console.log(`🤖 Modèle IA : ${GEMINI_MODEL}`);
  console.log(
    `🔑 Gemini API : ${GEMINI_API_KEY ? "configurée" : "NON CONFIGURÉE"}`
  );
});
