const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API escuchando en puerto", PORT);
});