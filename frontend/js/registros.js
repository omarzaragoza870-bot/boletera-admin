/* ============================================================

   ALPHA v1.1: REGISTROS OPERATIVOS

   RESPONSABILIDAD:
   - Abrir selector de Nuevo Registro.
   - Enrutar cada tipo de registro.
   - Mantener el flujo actual de Función usando el formulario existente.
   - Preparar base para Activación, Clase, Ensayo, Grabación,
     Evento Especial, Traslado y Mantenimiento.

============================================================ */

const TIPOS_REGISTRO = {
    funcion: {
        icono: "🎭",
        nombre: "Función",
        clase: "tipo-funcion"
    },
    activacion: {
        icono: "📍",
        nombre: "Activación",
        clase: "tipo-activacion"
    },
    clase: {
        icono: "🎓",
        nombre: "Clase",
        clase: "tipo-clase"
    },
    ensayo: {
        icono: "🎤",
        nombre: "Ensayo",
        clase: "tipo-ensayo"
    },
    grabacion: {
        icono: "🎬",
        nombre: "Grabación",
        clase: "tipo-grabacion"
    },
    especial: {
        icono: "🎪",
        nombre: "Evento especial",
        clase: "tipo-especial"
    },
    traslado: {
        icono: "🚚",
        nombre: "Traslado",
        clase: "tipo-traslado"
    },
    mantenimiento: {
        icono: "🛠️",
        nombre: "Mantenimiento",
        clase: "tipo-mantenimiento"
    }
};

function abrirSelectorNuevoRegistro(){

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalNuevoRegistro")
        .classList
        .remove("oculto");
}

function cerrarSelectorNuevoRegistro(){

    document
        .getElementById("modalNuevoRegistro")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

// Alias para mantener el patron de modales del resto del sistema.
function abrirModalNuevoRegistro(){ abrirSelectorNuevoRegistro(); }
function cerrarModalNuevoRegistro(){ cerrarSelectorNuevoRegistro(); }

function seleccionarTipoRegistro(tipo){

    if(tipo === "funcion"){

        // Pasamos de un modal al otro SIN soltar el bloqueo de scroll:
        // solo ocultamos este modal y abrimos el de Nuevo Evento.
        document
            .getElementById("modalNuevoRegistro")
            .classList
            .add("oculto");

        mostrarSeccion("eventos");
        abrirModalNuevoEvento();
        return;
    }

    cerrarSelectorNuevoRegistro();

    const info =
        TIPOS_REGISTRO[tipo];

    mostrarToast(
        `${info.icono} ${info.nombre}: este formulario entra en el siguiente paso.`,
        "success"
    );
}

function obtenerTipoRegistroVisual(funcion){

    const tipo =
        funcion.tipoRegistro || "funcion";

    return TIPOS_REGISTRO[tipo] || TIPOS_REGISTRO.funcion;
}