const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/", (req, res) => {
  res.json({ message: "MiTV Pro backend funcionando 🚀" });
});
app.post("/playlists", async (req, res) => {
  try {
    const { name, m3u_url } = req.body;

    const result = await pool.query(
      "INSERT INTO playlists (name, m3u_url) VALUES ($1, $2) RETURNING *",
      [name, m3u_url]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando playlist" });
  }
});
app.get("/playlists", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM playlists ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo playlists" });
  }
});
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "MiTV Pro backend funcionando 🚀",
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error conectando a la base de datos");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API escuchando en puerto", PORT);
});