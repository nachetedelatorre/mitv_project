const express = require("express");
const { Pool } = require("pg");

const app = express();

// Permitir JSON (Flutter)
app.use(express.json());

// Permitir formularios HTML (panel admin)
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ==========================
// ROOT
// ==========================
app.get("/", async (req, res) => {
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

// ==========================
// PANEL ADMIN
// ==========================
app.get("/admin", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM playlists ORDER BY id DESC"
    );

    const playlists = result.rows;

    let listHtml = playlists
      .map(
        (p) => `
          <li>
            <strong>${p.name}</strong><br/>
            ${p.m3u_url}
          </li>
        `
      )
      .join("");

    res.send(`
      <h1>MiTV Pro - Panel Admin</h1>

      <form method="POST" action="/playlists">
        <input name="name" placeholder="Nombre playlist" required />
        <input name="m3u_url" placeholder="URL M3U" required />
        <button type="submit">Guardar</button>
      </form>

      <h2>Playlists guardadas</h2>
      <ul>
        ${listHtml}
      </ul>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error cargando panel");
  }
});

// ==========================
// CREAR PLAYLIST
// ==========================
app.post("/playlists", async (req, res) => {
  try {
    const { name, m3u_url } = req.body;

    await pool.query(
      "INSERT INTO playlists (name, m3u_url) VALUES ($1, $2)",
      [name, m3u_url]
    );

    // Si viene del panel HTML → redirige
    if (req.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
      return res.redirect("/admin");
    }

    // Si viene de Flutter → devuelve JSON
    res.json({ success: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando playlist" });
  }
});

// ==========================
// OBTENER PLAYLISTS
// ==========================
app.get("/playlists", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM playlists ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo playlists" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API escuchando en puerto", PORT);
});