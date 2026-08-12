const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;


/*
 * ==============================
 * MIDDLEWARE
 * ==============================
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
 * ==============================
 * ROUTE DE TEST
 * ==============================
 */

app.get("/", (req, res) => {

  res.json({
    success: true,
    name: "LOX BACKEND",
    module: "LOX PRIME",
    version: "1.0.0",
    status: "online"
  });

});


/*
 * ==============================
 * HEALTH CHECK
 * ==============================
 */

app.get("/health", (req, res) => {

  res.json({
    status: "ok"
  });

});


/*
 * ==============================
 * CHAT
 * ==============================
 *
 * Pour l'instant, cette route
 * teste uniquement la communication
 * entre PRIME et le backend.
 *
 * Le véritable fournisseur IA sera
 * connecté ensuite.
 */

app.post("/api/chat", async (req, res) => {

  try {

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
     * Réponse temporaire du backend.
     */

    const response =
      `LOX BACKEND a bien reçu ton message : "${cleanMessage}"`;


    return res.json({

      success: true,

      reply: response,

      source: "lox-backend",

      version: "1.0.0"

    });


  } catch (error) {

    console.error(
      "Erreur /api/chat :",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Erreur interne du serveur."

    });

  }

});


/*
 * ==============================
 * ROUTE INCONNUE
 * ==============================
 */

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error: "Route introuvable."

  });

});


/*
 * ==============================
 * SERVEUR
 * ==============================
 */

app.listen(
  PORT,
  () => {

    console.log(
      `LOX BACKEND démarré sur le port ${PORT}`
    );

  }
);
