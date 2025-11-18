// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // θα το βάλεις στο Render, ΟΧΙ εδώ

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname)); // σερβίρει index.html, manifest κλπ από το root

app.post("/api/chat", async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "No GEMINI_API_KEY set" });
    }

    const { prompt, history = [], image } = req.body;

    // Μετατροπή ιστορικού σε format Gemini
    const contents = [];

    for (const msg of history) {
      const role = msg.role === "user" ? "user" : "model";
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    }

    const userParts = [];
    if (prompt && prompt.trim() !== "") {
      userParts.push({ text: prompt });
    }

    if (image) {
      userParts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: image // base64 χωρίς prefix
        }
      });
    }

    contents.push({
      role: "user",
      parts: userParts
    });

    const body = { contents };

    const fetchRes = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,

      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await fetchRes.json();

    if (!fetchRes.ok) {
      console.error("Gemini error:", data);
      return res.status(500).json({
        error: "Gemini API error",
        details: data
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Δεν πήρα απάντηση από το Gemini.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
