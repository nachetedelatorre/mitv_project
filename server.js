const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("MiTV Pro backend funcionando 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("API escuchando en puerto", PORT);
});