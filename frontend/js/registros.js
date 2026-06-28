/* ============================================================

   ALPHA v1.4: MOTOR DE REGISTROS

   RESPONSABILIDAD:
   - Centralizar tipos operativos.
   - Abrir formulario genérico para todos los tipos no boleteros.
   - Guardar registros en backend usando /api/registros.
   - Mantener Función con el flujo actual de evento/función.
   - Preparar timeline y checklist base.

============================================================ */

const TIPOS_REGISTRO = {
    funcion: {
        icono: "🎭",
        nombre: "Función",
        clase: "tipo-funcion",
        descripcion: "Obra o presentación abierta al público."
    },
    activacion: {
        icono: "📍",
        nombre: "Activación",
        clase: "tipo-activacion",
        descripcion: "Marca, plaza o evento promocional."
    },
    clase: {
        icono: "🎓",
        nombre: "Clase",
        clase: "tipo-clase",
        descripcion: "Taller, curso, masterclass o capacitación."
    },
    ensayo: {
        icono: "🎤",
        nombre: "Ensayo",
        clase: "tipo-ensayo",
        descripcion: "Preparación artística o técnica."
    },
    grabacion: {
        icono: "🎬",
        nombre: "Grabación",
        clase: "tipo-grabacion",
        descripcion: "Video, streaming, contenido o sesión."
    },
    especial: {
        icono: "🎪",
        nombre: "Evento especial",
        clase: "tipo-especial",
        descripcion: "Actividad única o evento no recurrente."
    },
    traslado: {
        icono: "🚚",
        nombre: "Traslado",
        clase: "tipo-traslado",
        descripcion: "Equipo, staff, utilería o logística."
    },
    mantenimiento: {
        icono: "🛠️",
        nombre: "Mantenimiento",
        clase: "tipo-mantenimiento",
        descripcion: "Reparaciones o revisión técnica."
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

    const modal =
        document.getElementById("modalNuevoRegistro");

    if(modal){
        modal.classList.add("oculto");
    }

    document.body.classList.remove("modal-abierto");
}

// Alias para mantener compatibilidad con botones existentes.
function abrirModalNuevoRegistro(){ abrirSelectorNuevoRegistro(); }
function cerrarModalNuevoRegistro(){ cerrarSelectorNuevoRegistro(); }

function seleccionarTipoRegistro(tipo){

    if(tipo === "funcion"){

        document
            .getElementById("modalNuevoRegistro")
            .classList
            .add("oculto");

        mostrarSeccion("eventos");
        abrirModalNuevoEvento();
        return;
    }

    document
        .getElementById("modalNuevoRegistro")
        .classList
        .add("oculto");

    abrirModalRegistroGenerico(tipo);
}

function abrirModalRegistroGenerico(tipo){

    const info =
        TIPOS_REGISTRO[tipo] || TIPOS_REGISTRO.activacion;

    limpiarFormularioRegistroGenerico();

    document.getElementById("registroGenericoTipo").value =
        tipo;

    document.getElementById("registroGenericoIcono").textContent =
        info.icono;

    document.getElementById("registroGenericoTitulo").textContent =
        `Nuevo registro · ${info.nombre}`;

    document.getElementById("registroGenericoDescripcion").textContent =
        info.descripcion;

    document.getElementById("registroGenericoPreviewIcono").textContent =
        info.icono;

    document.getElementById("registroGenericoPreviewTitulo").textContent =
        `${info.nombre} operativo`;

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalRegistroGenerico")
        .classList
        .remove("oculto");
}

function cerrarModalRegistroGenerico(){

    document
        .getElementById("modalRegistroGenerico")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

function limpiarFormularioRegistroGenerico(){

    [
        "registroGenericoTipo",
        "registroGenericoNombre",
        "registroGenericoLugar",
        "registroGenericoFecha",
        "registroGenericoHora",
        "registroGenericoContacto",
        "registroGenericoTelefono",
        "registroGenericoNotas"
    ].forEach(id => {
        const campo =
            document.getElementById(id);

        if(campo){
            campo.value = "";
        }
    });
}

async function guardarRegistroGenerico(){

    const tipo =
        document.getElementById("registroGenericoTipo").value;

    const nombre =
        document.getElementById("registroGenericoNombre").value.trim();

    const lugar =
        document.getElementById("registroGenericoLugar").value.trim();

    const fecha =
        document.getElementById("registroGenericoFecha").value;

    const hora =
        document.getElementById("registroGenericoHora").value;

    const contacto =
        document.getElementById("registroGenericoContacto").value.trim();

    const telefono =
        document.getElementById("registroGenericoTelefono").value.trim();

    const notas =
        document.getElementById("registroGenericoNotas").value.trim();

    if(!nombre || !lugar || !fecha || !hora){
        mostrarToast("Completa nombre, lugar, fecha y hora", "warning");
        return;
    }

    const respuesta =
        await fetch(`${API_URL}/api/registros`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tipoRegistro: tipo,
                nombre,
                lugar,
                fecha,
                hora,
                contacto,
                telefono,
                notas
            })
        });

    const resultado =
        await respuesta.json();

    if(!respuesta.ok){
        mostrarToast(resultado.mensaje || "No se pudo guardar", "error");
        return;
    }

    cerrarModalRegistroGenerico();

    mostrarToast(resultado.mensaje || "Registro guardado", "success");

    cargarEventos();

    mostrarSeccion("funciones");
}

function obtenerTipoRegistroVisual(funcion){

    const tipo =
        funcion.tipoRegistro || "funcion";

    return TIPOS_REGISTRO[tipo] || TIPOS_REGISTRO.funcion;
}

function obtenerTipoRegistroDesdeEvento(evento, funcion){

    return (
        funcion?.tipoRegistro ||
        evento?.tipoRegistro ||
        "funcion"
    );
}