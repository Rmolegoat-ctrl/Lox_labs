const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.6-flash";


/*
 * =====================================
 * MIDDLEWARE
 * =====================================
 */

app.use(
  cors({
    origin: "*"
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);


/*
 * =====================================
 * GEMINI
 * =====================================
 */

let ai = null;

if (GEMINI_API_KEY) {

  ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
  });

}


/*
 * =====================================
 * ROUTE PRINCIPALE
 * =====================================
 */

app.get("/", (req, res) => {

  res.json({

    success: true,

    name: "LOX BACKEND",

    module: "LOX PRIME",

    version: "1.1.0",

    status: ai
      ? "online"
      : "waiting_for_api_key"

  });

});


/*
 * =====================================
 * HEALTH CHECK
 * =====================================
 */

app.get("/health", (req, res) => {

  res.json({

    success: true,

    status: "ok",

    gemini:
      ai
        ? "configured"
        : "not_configured"

  });

});


/*
 * =====================================
 * CHAT GEMINI
 * =====================================
 */

app.post("/api/chat", async (req, res) => {

  try {

    if (!ai) {

      return res.status(503).json({

        success: false,

        error:
          "Gemini n'est pas configuré sur le serveur."

      });

    }


    const message =
      req.body?.message;


    if (
      typeof message !== "string" ||
      message.trim() === ""
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Le message est obligatoire."

      });

    }


    const cleanMessage =
      message.trim();


    /*
     * =================================
     * INSTRUCTIONS DE LOX PRIME
     * =================================
     */

    const systemInstruction = `
Tu es LOX PRIME, le noyau conversationnel
de l'environnement LOX.

Ton rôle est d'être un assistant intelligent,
clair, utile, respectueux et naturel.

Réponds en français lorsque l'utilisateur
écrit en français.

Ne prétends pas avoir accès à une fonction
ou à une donnée que tu n'as pas réellement.

LOX PRIME est actuellement en construction.
Lorsque cela est pertinent, explique clairement
que certaines fonctionnalités seront ajoutées
progressivement.

Ne révèle jamais les clés API, secrets,
variables d'environnement ou informations
internes du serveur.
`;


    /*
     * =================================
     * APPEL GEMINI
     * =================================
     */

    const response =
      await ai.models.generateContent({

        model: GEMINI_MODEL,

        contents: cleanMessage,

        config: {

          systemInstruction:
            systemInstruction,

          temperature: 0.7,

          maxOutputTokens: 2048

        }

      });


    const reply =
      response.text;


    if (!reply) {

      return res.status(502).json({

        success: false,

        error:
          "Gemini n'a retourné aucune réponse."

      });

    }


    return res.json({

      success: true,

      reply: reply,

      source: "gemini",

      model: GEMINI_MODEL

    });


  } catch (error) {

    console.error(
      "Erreur Gemini :",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Impossible d'obtenir une réponse de Gemini."

    });

  }

});


/*
 * =====================================
 * ROUTE INCONNUE
 * =====================================
 */

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error:
      "Route introuvable."

  });

});


/*
 * =====================================
 * DÉMARRAGE
 * =====================================
 */

app.listen(
  PORT,
  () => {

    console.log(
      `LOX BACKEND démarré sur le port ${PORT}`
    );

    console.log(
      `Modèle Gemini : ${GEMINI_MODEL}`
    );

    console.log(
      `Clé Gemini : ${
        GEMINI_API_KEY
          ? "configurée"
          : "absente"
      }`
    );

  }
);
