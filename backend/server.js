const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "../database/db.json");

function leerDB() {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
}

app.get("/", (req, res) => {
  res.send("Servidor de boletera funcionando");
});

app.get("/api/configuracion", (req, res) => {
  const db = leerDB();
  res.json(db.configuracion);
});

app.get("/api/eventos", (req, res) => {
  const db = leerDB();
  res.json(db.eventos);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});