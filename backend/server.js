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


function crearCategoriasVacias() {
  return {
    general: {
      preventa: 0,
      precio: 0,
      boletos: 0
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
}

function normalizarTipoRegistro(tipo) {
  const tiposPermitidos = [
    "funcion",
    "activacion",
    "clase",
    "ensayo",
    "grabacion",
    "especial",
    "traslado",
    "mantenimiento"
  ];

  return tiposPermitidos.includes(tipo) ? tipo : "funcion";
}

function crearTimeline(tipoRegistro) {
  return [
    {
      id: Date.now(),
      tipo: "creacion",
      mensaje: `Registro creado (${tipoRegistro})`,
      fecha: new Date().toISOString()
    }
  ];
}

function crearChecklistBase(tipoRegistro) {
  return [];
}


app.get("/", (req, res) => {
  res.send("Servidor de boletera funcionando");
});


app.post("/api/registros", (req, res) => {

  const db = leerDB();

  const {
    tipoRegistro,
    nombre,
    lugar,
    fecha,
    hora,
    contacto,
    telefono,
    notas
  } = req.body;

  const tipoFinal = normalizarTipoRegistro(tipoRegistro);

  if (!nombre || !lugar || !fecha || !hora) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios"
    });
  }

  if (!db.eventos) {
    db.eventos = [];
  }

  const nuevoRegistro = {
    id: Date.now(),
    tipoRegistro: tipoFinal,
    nombre,
    lugar,
    imagen: "",
    activo: true,
    contacto: contacto || "",
    telefono: telefono || "",
    notas: notas || "",
    checklist: crearChecklistBase(tipoFinal),
    documentos: [],
    contactos: contacto ? [
      {
        id: 1,
        nombre: contacto,
        telefono: telefono || ""
      }
    ] : [],
    timeline: crearTimeline(tipoFinal),
    funciones: [
      {
        id: 1,
        tipoRegistro: tipoFinal,
        fecha,
        hora,
        categorias: crearCategoriasVacias(),
        descuentos: [],
        descuentosActivos: true,
        precio: 0,
        boletosDisponibles: 0,
        contacto: contacto || "",
        telefono: telefono || "",
        notas: notas || "",
        checklist: crearChecklistBase(tipoFinal),
        timeline: crearTimeline(tipoFinal),
        estado: "pendiente",
        activa: true
      }
    ]
  };

  db.eventos.push(nuevoRegistro);

  guardarDB(db);

  res.json({
    mensaje: "Registro creado correctamente",
    registro: nuevoRegistro
  });
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
    tipoRegistro: "funcion",
    nombre,
    lugar,
    imagen: imagen || "",
    activo: true,
    checklist: [],
    documentos: [],
    contactos: [],
    timeline: crearTimeline("funcion"),
    funciones: [
      {
        id: 1,
        tipoRegistro: "funcion",
        fecha,
        hora,

        categorias: categoriasFinales,

        descuentos: descuentos || [],

        precio: precioBase,
        boletosDisponibles: boletosTotales,

        estado: "pendiente",
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


/* ============================================================
   ALPHA v1.8: EDITAR OPERACIÓN

   Edita solo datos básicos del registro (nombre, lugar, fecha,
   hora, contacto, teléfono, notas). NO toca checklist, material,
   estado, categorías, descuentos ni ventas. Ruta distinta a la
   del editor de Función (que vive en PUT .../funciones/:funcionId).
============================================================ */

app.put("/api/eventos/:eventoId/funciones/:funcionId/datos", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  const nombre = String(req.body.nombre || "").trim();
  const lugar = String(req.body.lugar || "").trim();
  const fecha = String(req.body.fecha || "").trim();
  const hora = String(req.body.hora || "").trim();

  if (!nombre || !lugar || !fecha || !hora) {
    return res.status(400).json({ mensaje: "Completa nombre, lugar, fecha y hora" });
  }

  // Datos de nivel evento.
  evento.nombre = nombre;
  evento.lugar = lugar;

  // Datos de nivel función (operación).
  funcion.fecha = fecha;
  funcion.hora = hora;
  funcion.contacto = String(req.body.contacto || "").trim();
  funcion.telefono = String(req.body.telefono || "").trim();
  funcion.notas = String(req.body.notas || "").trim();

  const movimiento = {
    id: Date.now(),
    tipo: "edicion",
    mensaje: "Operación editada",
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);

  res.json({ mensaje: "Operación actualizada" });
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

app.patch("/api/eventos/:eventoId/funciones/:funcionId/descuentos/toggle", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);

  const evento = db.eventos.find(item => item.id === eventoId);

  if (!evento) {
    return res.status(404).json({
      mensaje: "Evento no encontrado"
    });
  }

  const funcion = evento.funciones.find(item => item.id === funcionId);

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Función no encontrada"
    });
  }

  funcion.descuentosActivos =
    !Boolean(funcion.descuentosActivos);

  guardarDB(db);

  res.json({
    mensaje: "Estado de descuentos actualizado"
  });

});


app.patch("/api/eventos/:eventoId/funciones/:funcionId/checklist/:itemId/toggle", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);

  const evento = db.eventos.find(item => item.id === eventoId);

  if (!evento) {
    return res.status(404).json({
      mensaje: "Registro no encontrado"
    });
  }

  const funcion = evento.funciones.find(item => item.id === funcionId);

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Fecha del registro no encontrada"
    });
  }

  if (!funcion.checklist && evento.checklist) {
    funcion.checklist = JSON.parse(JSON.stringify(evento.checklist));
  }

  if (!funcion.checklist) {
    funcion.checklist = [];
  }

  const itemChecklist = funcion.checklist.find(item => Number(item.id) === itemId);

  if (!itemChecklist) {
    return res.status(404).json({
      mensaje: "Item de checklist no encontrado"
    });
  }

  itemChecklist.completado = !Boolean(itemChecklist.completado);

  if (!funcion.timeline) {
    funcion.timeline = [];
  }

  funcion.timeline.push({
    id: Date.now(),
    tipo: "checklist",
    mensaje: `${itemChecklist.completado ? "Completado" : "Reabierto"}: ${itemChecklist.texto}`,
    fecha: new Date().toISOString()
  });

  if (!evento.timeline) {
    evento.timeline = [];
  }

  evento.timeline.push({
    id: Date.now(),
    tipo: "checklist",
    mensaje: `${itemChecklist.completado ? "Completado" : "Reabierto"}: ${itemChecklist.texto}`,
    fecha: new Date().toISOString()
  });

  guardarDB(db);

  res.json({
    mensaje: "Checklist actualizado correctamente",
    checklist: funcion.checklist
  });

});



app.post("/api/eventos/:eventoId/funciones/:funcionId/checklist", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const texto = String(req.body.texto || "").trim();

  if (!texto) return res.status(400).json({ mensaje: "Escribe el pendiente" });

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.checklist) funcion.checklist = [];

  const nuevoItem = { id: Date.now(), texto, completado: false };
  funcion.checklist.push(nuevoItem);

  const movimiento = {
    id: Date.now() + 1,
    tipo: "checklist",
    mensaje: `Pendiente agregado: ${texto}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 2 });

  guardarDB(db);
  res.json({ mensaje: "Pendiente agregado", item: nuevoItem, checklist: funcion.checklist });
});

app.put("/api/eventos/:eventoId/funciones/:funcionId/checklist/:itemId", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);
  const texto = String(req.body.texto || "").trim();

  if (!texto) return res.status(400).json({ mensaje: "Escribe el nuevo nombre del pendiente" });

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.checklist) funcion.checklist = [];
  const itemChecklist = funcion.checklist.find(item => Number(item.id) === itemId);
  if (!itemChecklist) return res.status(404).json({ mensaje: "Pendiente no encontrado" });

  const anterior = itemChecklist.texto;
  itemChecklist.texto = texto;

  const movimiento = {
    id: Date.now(),
    tipo: "checklist",
    mensaje: `Pendiente renombrado: ${anterior} -> ${texto}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);
  res.json({ mensaje: "Pendiente actualizado", item: itemChecklist, checklist: funcion.checklist });
});

app.delete("/api/eventos/:eventoId/funciones/:funcionId/checklist/:itemId", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.checklist) funcion.checklist = [];
  const index = funcion.checklist.findIndex(item => Number(item.id) === itemId);
  if (index === -1) return res.status(404).json({ mensaje: "Pendiente no encontrado" });

  const eliminado = funcion.checklist.splice(index, 1)[0];

  const movimiento = {
    id: Date.now(),
    tipo: "checklist",
    mensaje: `Pendiente eliminado: ${eliminado.texto}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);
  res.json({ mensaje: "Pendiente eliminado", checklist: funcion.checklist });
});


/* ============================================================
   ALPHA v1.7: MATERIAL POR OPERACIÓN
   Material = cosas que llevar/preparar (distinto del checklist).
   Item: { id, nombre, listo }
============================================================ */

app.post("/api/eventos/:eventoId/funciones/:funcionId/material", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const nombre = String(req.body.nombre || "").trim();

  if (!nombre) return res.status(400).json({ mensaje: "Escribe el material" });

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.material) funcion.material = [];

  const nuevoItem = { id: Date.now(), nombre, listo: false };
  funcion.material.push(nuevoItem);

  const movimiento = {
    id: Date.now() + 1,
    tipo: "material",
    mensaje: `Material agregado: ${nombre}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 2 });

  guardarDB(db);
  res.json({ mensaje: "Material agregado", item: nuevoItem, material: funcion.material });
});


app.patch("/api/eventos/:eventoId/funciones/:funcionId/material/:itemId/toggle", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.material) funcion.material = [];

  const item = funcion.material.find(m => Number(m.id) === itemId);
  if (!item) return res.status(404).json({ mensaje: "Material no encontrado" });

  item.listo = !item.listo;

  const movimiento = {
    id: Date.now(),
    tipo: "material",
    mensaje: item.listo ? `Material listo: ${item.nombre}` : `Material pendiente: ${item.nombre}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);
  res.json({ mensaje: "Material actualizado", material: funcion.material });
});


app.put("/api/eventos/:eventoId/funciones/:funcionId/material/:itemId", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);
  const nombre = String(req.body.nombre || "").trim();

  if (!nombre) return res.status(400).json({ mensaje: "Escribe el nuevo nombre del material" });

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.material) funcion.material = [];

  const item = funcion.material.find(m => Number(m.id) === itemId);
  if (!item) return res.status(404).json({ mensaje: "Material no encontrado" });

  const anterior = item.nombre;
  item.nombre = nombre;

  const movimiento = {
    id: Date.now(),
    tipo: "material",
    mensaje: `Material editado: ${anterior} → ${nombre}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);
  res.json({ mensaje: "Material actualizado", material: funcion.material });
});


app.delete("/api/eventos/:eventoId/funciones/:funcionId/material/:itemId", (req, res) => {
  const db = leerDB();
  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const itemId = Number(req.params.itemId);

  const evento = db.eventos.find(item => item.id === eventoId);
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });

  const funcion = evento.funciones.find(item => item.id === funcionId);
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.material) funcion.material = [];
  const index = funcion.material.findIndex(m => Number(m.id) === itemId);
  if (index === -1) return res.status(404).json({ mensaje: "Material no encontrado" });

  const eliminado = funcion.material.splice(index, 1)[0];

  const movimiento = {
    id: Date.now(),
    tipo: "material",
    mensaje: `Material eliminado: ${eliminado.nombre}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(movimiento);
  evento.timeline.push({ ...movimiento, id: Date.now() + 1 });

  guardarDB(db);
  res.json({ mensaje: "Material eliminado", material: funcion.material });
});


/* ============================================================
   ALPHA v1.11: DOCUMENTOS POR OPERACIÓN
   Item: { id, nombre, tipo, url, notas, creadoEn }
============================================================ */

function timelineDoc(evento, funcion, mensaje){
  const mov = { id: Date.now(), tipo: "documento", mensaje, fecha: new Date().toISOString() };
  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(mov);
  evento.timeline.push({ ...mov, id: Date.now() + 1 });
}

app.post("/api/eventos/:eventoId/funciones/:funcionId/documentos", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  const nombre = String(req.body.nombre || "").trim();
  if (!nombre) return res.status(400).json({ mensaje: "Escribe el nombre del documento" });

  if (!funcion.documentos) funcion.documentos = [];

  const nuevo = {
    id: Date.now(),
    nombre,
    tipo: String(req.body.tipo || "").trim(),
    url: String(req.body.url || "").trim(),
    notas: String(req.body.notas || "").trim(),
    creadoEn: new Date().toISOString()
  };
  funcion.documentos.push(nuevo);
  timelineDoc(evento, funcion, `Documento agregado: ${nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Documento agregado", item: nuevo, documentos: funcion.documentos });
});

app.put("/api/eventos/:eventoId/funciones/:funcionId/documentos/:documentoId", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.documentos) funcion.documentos = [];
  const doc = funcion.documentos.find(d => Number(d.id) === Number(req.params.documentoId));
  if (!doc) return res.status(404).json({ mensaje: "Documento no encontrado" });

  const nombre = String(req.body.nombre || "").trim();
  if (!nombre) return res.status(400).json({ mensaje: "Escribe el nombre del documento" });

  doc.nombre = nombre;
  doc.tipo = String(req.body.tipo || "").trim();
  doc.url = String(req.body.url || "").trim();
  doc.notas = String(req.body.notas || "").trim();
  timelineDoc(evento, funcion, `Documento editado: ${nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Documento actualizado", documentos: funcion.documentos });
});

app.delete("/api/eventos/:eventoId/funciones/:funcionId/documentos/:documentoId", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.documentos) funcion.documentos = [];
  const index = funcion.documentos.findIndex(d => Number(d.id) === Number(req.params.documentoId));
  if (index === -1) return res.status(404).json({ mensaje: "Documento no encontrado" });

  const eliminado = funcion.documentos.splice(index, 1)[0];
  timelineDoc(evento, funcion, `Documento eliminado: ${eliminado.nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Documento eliminado", documentos: funcion.documentos });
});


/* ============================================================
   ALPHA v1.12: PERSONAS POR OPERACIÓN
   Item: { id, nombre, rol, telefono, correo, notas, creadoEn }
============================================================ */

function timelinePersona(evento, funcion, mensaje){
  const mov = { id: Date.now(), tipo: "persona", mensaje, fecha: new Date().toISOString() };
  if (!funcion.timeline) funcion.timeline = [];
  if (!evento.timeline) evento.timeline = [];
  funcion.timeline.push(mov);
  evento.timeline.push({ ...mov, id: Date.now() + 1 });
}

app.post("/api/eventos/:eventoId/funciones/:funcionId/personas", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  const nombre = String(req.body.nombre || "").trim();
  if (!nombre) return res.status(400).json({ mensaje: "Escribe el nombre de la persona" });

  if (!funcion.personas) funcion.personas = [];

  const nueva = {
    id: Date.now(),
    nombre,
    rol: String(req.body.rol || "").trim(),
    telefono: String(req.body.telefono || "").trim(),
    correo: String(req.body.correo || "").trim(),
    notas: String(req.body.notas || "").trim(),
    creadoEn: new Date().toISOString()
  };
  funcion.personas.push(nueva);
  timelinePersona(evento, funcion, `Persona agregada: ${nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Persona agregada", item: nueva, personas: funcion.personas });
});

app.put("/api/eventos/:eventoId/funciones/:funcionId/personas/:personaId", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.personas) funcion.personas = [];
  const persona = funcion.personas.find(p => Number(p.id) === Number(req.params.personaId));
  if (!persona) return res.status(404).json({ mensaje: "Persona no encontrada" });

  const nombre = String(req.body.nombre || "").trim();
  if (!nombre) return res.status(400).json({ mensaje: "Escribe el nombre de la persona" });

  persona.nombre = nombre;
  persona.rol = String(req.body.rol || "").trim();
  persona.telefono = String(req.body.telefono || "").trim();
  persona.correo = String(req.body.correo || "").trim();
  persona.notas = String(req.body.notas || "").trim();
  timelinePersona(evento, funcion, `Persona editada: ${nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Persona actualizada", personas: funcion.personas });
});

app.delete("/api/eventos/:eventoId/funciones/:funcionId/personas/:personaId", (req, res) => {
  const db = leerDB();
  const evento = db.eventos.find(item => item.id === Number(req.params.eventoId));
  if (!evento) return res.status(404).json({ mensaje: "Registro no encontrado" });
  const funcion = evento.funciones.find(item => item.id === Number(req.params.funcionId));
  if (!funcion) return res.status(404).json({ mensaje: "Fecha del registro no encontrada" });

  if (!funcion.personas) funcion.personas = [];
  const index = funcion.personas.findIndex(p => Number(p.id) === Number(req.params.personaId));
  if (index === -1) return res.status(404).json({ mensaje: "Persona no encontrada" });

  const eliminada = funcion.personas.splice(index, 1)[0];
  timelinePersona(evento, funcion, `Persona eliminada: ${eliminada.nombre}`);

  guardarDB(db);
  res.json({ mensaje: "Persona eliminada", personas: funcion.personas });
});

/* ============================================================
   ALPHA v1.5: ESTADO DE OPERACIÓN

   El usuario fija el estado manualmente. El estado "en curso"
   por fecha se calcula en el frontend al mostrar; aquí solo
   guardamos el valor elegido y registramos el timeline.
============================================================ */

app.patch("/api/eventos/:eventoId/funciones/:funcionId/estado", (req, res) => {

  const db = leerDB();

  const eventoId = Number(req.params.eventoId);
  const funcionId = Number(req.params.funcionId);
  const { estado } = req.body;

  const ESTADOS_VALIDOS = ["pendiente", "confirmado", "en_curso", "finalizado", "cancelado"];

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({
      mensaje: "Estado no válido"
    });
  }

  const evento = db.eventos.find(item => item.id === eventoId);

  if (!evento) {
    return res.status(404).json({
      mensaje: "Registro no encontrado"
    });
  }

  const funcion = evento.funciones.find(item => item.id === funcionId);

  if (!funcion) {
    return res.status(404).json({
      mensaje: "Fecha del registro no encontrada"
    });
  }

  const NOMBRES = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    en_curso: "En curso",
    finalizado: "Finalizado",
    cancelado: "Cancelado"
  };

  const estadoAnterior =
    funcion.estado || "pendiente";

  funcion.estado = estado;

  const entrada = {
    id: Date.now(),
    tipo: "estado",
    mensaje: `Estado cambiado: ${NOMBRES[estadoAnterior]} → ${NOMBRES[estado]}`,
    fecha: new Date().toISOString()
  };

  if (!funcion.timeline) {
    funcion.timeline = [];
  }

  funcion.timeline.push(entrada);

  if (!evento.timeline) {
    evento.timeline = [];
  }

  evento.timeline.push({
    ...entrada,
    id: Date.now() + 1
  });

  guardarDB(db);

  res.json({
    mensaje: "Estado actualizado",
    estado
  });
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});