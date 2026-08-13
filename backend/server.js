const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

/*
========================================
CONFIGURATION GEMINI
========================================
*/

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: GEMINI_API_KEY
    })
    : null;


/*
========================================
IDENTITÉ LOX PRIME
========================================
*/

const SYSTEM_INSTRUCTION = `
Tu es LOX PRIME.

Tu es une intelligence artificielle personnelle,
conçue pour accompagner l'utilisateur avec
intelligence, clarté, bienveillance et efficacité.

Ton nom est LOX PRIME.

Tu réponds principalement en français,
sauf si l'utilisateur demande une autre langue.

Tu dois être naturel, utile, précis et honnête.

Tu ne prétends pas être humain.

Tu peux aider pour :
- les questions générales
- l'apprentissage
- la programmation
- les projets
- l'organisation
- la réflexion
- la créativité
- l'analyse
- la résolution de problèmes

Lorsque tu ne sais pas quelque chose,
tu le dis clairement au lieu d'inventer.

Tu dois conserver le contexte de la conversation
qui t'est transmis.
`;


/*
========================================
MIDDLEWARE
========================================
*/

app.use(express.static(path.join(__dirname, "..")));


/*
========================================
PAGE PRINCIPALE
========================================
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "..", "index.html")
    );

});


/*
========================================
HEALTH CHECK
========================================
*/

app.get("/health", (req, res) => {

    res.json({
        success: true,
        name: "LOX PRIME BACKEND",
        version: "1.2.0",
        status: "online",
        ai: ai ? "configured" : "not_configured",
        model: "gemini-2.5-flash"
    });

});


/*
========================================
CHAT LOX PRIME
========================================
*/

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            history = []
        } = req.body;


        /*
        Vérification du message
        */

        if (
            !message ||
            typeof message !== "string" ||
            !message.trim()
        ) {

            return res.status(400).json({
                success: false,
                error: "Message invalide."
            });

        }


        /*
        Vérification de la clé Gemini
        */

        if (!ai) {

            return res.status(500).json({
                success: false,
                error:
                    "La clé GEMINI_API_KEY n'est pas configurée sur le serveur."
            });

        }


        /*
        Construction de l'historique
        */

        const contents = [];


        if (Array.isArray(history)) {

            for (const item of history) {

                if (
                    !item ||
                    typeof item.content !== "string"
                ) {
                    continue;
                }


                const role =
                    item.role === "model"
                        ? "model"
                        : "user";


                contents.push({
                    role: role,
                    parts: [
                        {
                            text: item.content
                        }
                    ]
                });

            }

        }


        /*
        Ajouter le nouveau message
        */

        contents.push({
            role: "user",
            parts: [
                {
                    text: message.trim()
                }
            ]
        });


        /*
        Appel Gemini
        */

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: contents,

            config: {
                systemInstruction: SYSTEM_INSTRUCTION,

                temperature: 0.7,

                maxOutputTokens: 2048
            }

        });


        /*
        Récupération de la réponse
        */

        const reply =
            response.text ||
            "Je n'ai pas réussi à générer une réponse.";


        /*
        Réponse au frontend
        */

        res.json({

            success: true,

            reply: reply,

            model: "gemini-2.5-flash"

        });


    } catch (error) {

        console.error(
            "Erreur Gemini :",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Erreur lors de la communication avec Gemini."

        });

    }

});


/*
========================================
GESTION DES ERREURS
========================================
*/

app.use((err, req, res, next) => {

    console.error(
        "Erreur serveur :",
        err
    );

    res.status(500).json({

        success: false,

        error: "Erreur interne du serveur."

    });

});


/*
========================================
DÉMARRAGE
========================================
*/

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🚀 LOX fonctionne sur le port ${PORT}`
    );

    console.log(
        `🤖 Modèle Gemini : gemini-2.5-flash`
    );

    console.log(
        `🧠 IA : ${ai ? "configurée" : "non configurée"}`
    );

});
