const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/*
========================================
LOX LABS - CONFIGURATION
========================================
*/

app.use(cors());
app.use(express.json());

/*
========================================
FRONTEND
========================================

Le backend se trouve dans /backend,
tandis que les fichiers HTML sont à la
racine du projet.

On permet donc à Express de servir :

/index.html
/prime.html
/dashboard.html
/commencer.html
/etc.
*/

app.use(express.static(path.join(__dirname, "..")));

/*
========================================
ROUTE DE TEST DU BACKEND
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

        /*
        Vérification du message
        */

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                success: false,
                error: "Le message est obligatoire."
            });
        }

        /*
        Vérification de la clé Gemini
        */

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "GEMINI_API_KEY n'est pas configurée sur le serveur."
            });
        }

        /*
        Connexion à Gemini
        */

        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY
        });

        /*
        Envoi du message à Gemini
        */

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: message
        });

        /*
        Réponse au frontend
        */

        return res.json({
            success: true,
            reply: response.text
        });

    } catch (error) {

        console.error("Erreur Gemini :", error);

        return res.status(500).json({
            success: false,
            error: "Erreur lors de la communication avec Gemini."
        });
    }
});

/*
========================================
DÉMARRAGE DU SERVEUR
========================================
*/

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LOX fonctionne sur le port ${PORT}`);
    console.log(`🤖 Modèle Gemini : ${GEMINI_MODEL}`);
});
