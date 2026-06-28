/* ============================================================

   ALPHA v1.3: ACTIVACIONES REALES

   RESPONSABILIDAD:
   - Abrir formulario de activación.
   - Guardar activación en backend como registro operativo.
   - Recargar Agenda, Dashboard y Eventos después de guardar.

============================================================ */

function abrirModalNuevaActivacion(){

    cerrarSelectorNuevoRegistro();

    limpiarFormularioActivacion();

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalNuevaActivacion")
        .classList
        .remove("oculto");
}

function cerrarModalNuevaActivacion(){

    document
        .getElementById("modalNuevaActivacion")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

function limpiarFormularioActivacion(){

    const campos = [
        "activacionNombre",
        "activacionLugar",
        "activacionFecha",
        "activacionHora",
        "activacionContacto",
        "activacionTelefono",
        "activacionNotas"
    ];

    campos.forEach(id => {
        const campo = document.getElementById(id);
        if(campo){
            campo.value = "";
        }
    });
}

async function crearActivacion(boton){

    const activacion = {
        tipoRegistro: "activacion",
        nombre: document.getElementById("activacionNombre").value.trim(),
        lugar: document.getElementById("activacionLugar").value.trim(),
        fecha: document.getElementById("activacionFecha").value,
        hora: document.getElementById("activacionHora").value,
        contacto: document.getElementById("activacionContacto").value.trim(),
        telefono: document.getElementById("activacionTelefono").value.trim(),
        notas: document.getElementById("activacionNotas").value.trim()
    };

    if(!activacion.nombre || !activacion.lugar || !activacion.fecha || !activacion.hora){
        mostrarToast(
            "Completa nombre, lugar, fecha y hora.",
            "error"
        );
        return;
    }

    iniciarCarga(boton, "Guardando...");

    try{
        const respuesta = await fetch(`${API_URL}/api/registros`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(activacion)
        });

        const resultado = await respuesta.json();

        if(!respuesta.ok){
            mostrarToast(resultado.mensaje || "No se pudo guardar la activación.", "error");
            terminarCarga(boton);
            return;
        }

        mostrarToast("Activación guardada correctamente", "success");

        cerrarModalNuevaActivacion();

        await cargarEventos();

        // "funciones" es la sección del calendario de Agenda, donde la
        // activación se ve con su ícono 📍. (No es la lista de Eventos.)
        mostrarSeccion("funciones");

    }catch(error){
        console.error(error);
        mostrarToast("Error al guardar la activación.", "error");
    }

    terminarCarga(boton);
}
