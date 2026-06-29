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
  const checklists = {
    activacion: [
      "Confirmar lugar",
      "Confirmar contacto",
      "Confirmar material"
    ],
    clase: [
      "Confirmar profesor",
      "Confirmar grupo",
      "Confirmar material"
    ],
    ensayo: [
      "Confirmar elenco",
      "Confirmar espacio",
      "Confirmar horario"
    ],
    grabacion: [
      "Confirmar equipo",
      "Confirmar locacion",
      "Confirmar guion"
    ],
    especial: [
      "Confirmar responsables",
      "Confirmar horario",
      "Confirmar logística"
    ],
    traslado: [
      "Confirmar punto de salida",
      "Confirmar destino",
      "Confirmar responsable"
    ],
    mantenimiento: [
      "Identificar problema",
      "Asignar responsable",
      "Confirmar reparación"
    ]
  };

  return (checklists[tipoRegistro] || []).map((texto, index) => ({
    id: index + 1,
    texto,
    completado: false
  }));
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


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});