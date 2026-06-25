const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const dbPath = path.join(__dirname, "../database/db.json");

function leerDB() {
  const data = fs.readFileSync(dbPath, "utf8");
  return JSON.parse(data);
}

function guardarDB(data) {
  fs.writeFileSync(
    dbPath,
    JSON.stringify(data, null, 2)
  );
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

app.post("/api/eventos", (req, res) => {

  const db = leerDB();

  const {
    nombre,
    lugar,
    imagen,
    fecha,
    hora,
    categorias,
    descuentos
  } = req.body;

  const categoriasFinales = {
    general: {
      preventa: Number(categorias?.general?.preventa || 0),
      precio: Number(categorias?.general?.precio || 0),
      boletos: Number(categorias?.general?.boletos || 0)
    },

    preferente: {
      activa: Boolean(categorias?.preferente?.activa),
      preventa: Number(categorias?.preferente?.preventa || 0),
      precio: Number(categorias?.preferente?.precio || 0),
      boletos: Number(categorias?.preferente?.boletos || 0)
    },

    vip: {
      activa: Boolean(categorias?.vip?.activa),
      preventa: Number(categorias?.vip?.preventa || 0),
      precio: Number(categorias?.vip?.precio || 0),
      boletos: Number(categorias?.vip?.boletos || 0)
    }
  };

  const boletosTotales =
    categoriasFinales.general.boletos +
    (
      categoriasFinales.preferente.activa
        ? categoriasFinales.preferente.boletos
        : 0
    ) +
    (
      categoriasFinales.vip.activa
        ? categoriasFinales.vip.boletos
        : 0
    );

  const precioBase =
    categoriasFinales.general.precio;

  const nuevoEvento = {
    id: Date.now(),
    nombre,
    lugar,
    imagen: imagen || "",
    activo: true,
    funciones: [
      {
        id: 1,
        fecha,
        hora,

        categorias: categoriasFinales,

        descuentos: descuentos || [],

        precio: precioBase,
        boletosDisponibles: boletosTotales,

        activa: true
      }
    ]
  };

  db.eventos.push(nuevoEvento);

  guardarDB(db);

  res.json({
    mensaje: "Evento creado correctamente"
  });

});

app.patch("/api/eventos/:id/toggle", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.id);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  evento.activo = !evento.activo;

  guardarDB(db);

  res.json({
    mensaje: "Estado del evento actualizado",
    evento
  });

});

app.post("/api/eventos/:id/funciones", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.id);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const {
    fecha,
    hora,
    precio,
    boletosDisponibles,
    categorias,
    descuentos
  } = req.body;

  const categoriasFinales = categorias || {
    general: {
      preventa: Number(precio || 0),
      precio: Number(precio || 0),
      boletos: Number(boletosDisponibles || 0)
    },

    preferente: {
      activa: false,
      preventa: 0,
      precio: 0,
      boletos: 0
    },

    vip: {
      activa: false,
      preventa: 0,
      precio: 0,
      boletos: 0
    }
  };

  const boletosTotales =
    Number(categoriasFinales.general?.boletos || 0) +
    (
      categoriasFinales.preferente?.activa
        ? Number(categoriasFinales.preferente?.boletos || 0)
        : 0
    ) +
    (
      categoriasFinales.vip?.activa
        ? Number(categoriasFinales.vip?.boletos || 0)
        : 0
    );

  const nuevaFuncion = {
    id: Date.now(),
    fecha,
    hora,
    categorias: categoriasFinales,
    descuentos: descuentos || [],

    // Compatibilidad temporal
    precio: Number(categoriasFinales.general?.precio || precio || 0),
    boletosDisponibles: boletosTotales,

    activa: true
  };

  evento.funciones.push(nuevaFuncion);

  guardarDB(db);

  res.json({
    mensaje: "Función agregada correctamente",
    funcion: nuevaFuncion
  });

});

app.patch("/api/eventos/:eventoId/funciones/:funcionId/toggle", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const funcion = evento.funciones.find(
    item => item.id === funcionId
  );

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Función no encontrada"
    });
  }

  funcion.activa = !funcion.activa;

  guardarDB(db);

  res.json({
    mensaje: "Estado de función actualizado"
  });

});

app.delete("/api/eventos/:eventoId/funciones/:funcionId", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  evento.funciones = evento.funciones.filter(
    funcion => funcion.id !== funcionId
  );

  guardarDB(db);

  res.json({
    mensaje: "Función eliminada correctamente"
  });

});

app.put("/api/eventos/:eventoId/funciones/:funcionId", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const funcion = evento.funciones.find(
    item => item.id === funcionId
  );

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Función no encontrada"
    });
  }

  const {
    fecha,
    hora,
    categorias,
    precio,
    boletosDisponibles,
    descuentos
  } = req.body;

  const categoriasFinales = categorias || {
    general: {
      preventa: Number(precio || 0),
      precio: Number(precio || 0),
      boletos: Number(boletosDisponibles || 0)
    },

    preferente: {
      activa: false,
      preventa: 0,
      precio: 0,
      boletos: 0
    },

    vip: {
      activa: false,
      preventa: 0,
      precio: 0,
      boletos: 0
    }
  };

  const boletosTotales =
    Number(categoriasFinales.general?.boletos || 0) +
    (
      categoriasFinales.preferente?.activa
        ? Number(categoriasFinales.preferente?.boletos || 0)
        : 0
    ) +
    (
      categoriasFinales.vip?.activa
        ? Number(categoriasFinales.vip?.boletos || 0)
        : 0
    );

  funcion.fecha = fecha;
  funcion.hora = hora;
  funcion.categorias = categoriasFinales;
  funcion.precio = Number(categoriasFinales.general?.precio || precio || 0);
  funcion.boletosDisponibles = boletosTotales;

  if(descuentos){
    funcion.descuentos = descuentos;
  }

  guardarDB(db);

  res.json({
    mensaje: "Función actualizada correctamente"
  });

});

app.delete("/api/eventos/:id", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.id);

  const eventoExiste = db.eventos.find(
    evento => evento.id === eventoId
  );

  if (!eventoExiste) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  db.eventos = db.eventos.filter(
    evento => evento.id !== eventoId
  );

  guardarDB(db);

  res.json({
    mensaje: "Evento eliminado correctamente"
  });

});

app.put("/api/eventos/:id", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.id);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

const {
  nombre,
  lugar,
  imagen
} = req.body;

  evento.nombre = nombre;
  evento.lugar = lugar;
  evento.imagen = imagen || "";

  guardarDB(db);

  res.json({
    mensaje: "Evento actualizado correctamente"
  });

});

app.patch("/api/configuracion/bot/toggle", (req, res) => {

  const db = leerDB();

  db.configuracion.botActivo =
    !db.configuracion.botActivo;

  guardarDB(db);

  res.json({
    mensaje: "Estado del bot actualizado",
    configuracion: db.configuracion
  });

});

app.put("/api/configuracion/nombre", (req, res) => {

  const db = leerDB();

  const { nombreSistema } = req.body;

  db.configuracion.nombreSistema = nombreSistema;

  guardarDB(db);

  res.json({
    mensaje: "Nombre actualizado correctamente",
    configuracion: db.configuracion
  });

});

app.delete("/api/eventos/:eventoId/funciones/:funcionId/descuentos/:index", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const index = Number(req.params.index);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const funcion = evento.funciones.find(
    item => item.id === funcionId
  );

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Función no encontrada"
    });
  }

  if (!funcion.descuentos) {
    funcion.descuentos = [];
  }

  funcion.descuentos.splice(index, 1);

  guardarDB(db);

  res.json({
    mensaje: "Descuento eliminado correctamente"
  });

});

app.post("/api/eventos/:eventoId/funciones/:funcionId/descuentos", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(
    item => item.id === eventoId
  );

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const funcion = evento.funciones.find(
    item => item.id === funcionId
  );

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Función no encontrada"
    });
  }

  const {
    codigo,
    tipo,
    valor
  } = req.body;

  if (!funcion.descuentos) {
    funcion.descuentos = [];
  }

  funcion.descuentos.push({
    codigo,
    tipo,
    valor: Number(valor),
    activo: true
  });

  guardarDB(db);

  res.json({
    mensaje: "Descuento agregado correctamente"
  });

});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
