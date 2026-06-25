/* =============================
   MODULO CONFIGURACION
   ============================= */


async function cargarConfiguracion(){

    const respuesta = await fetch(`${API_URL}/api/configuracion`);
    const configuracion = await respuesta.json();

    document.getElementById("estadoBot").textContent =
        configuracion.botActivo
        ? "🟢 Bot Encendido"
        : "🔴 Bot Apagado";

    document.getElementById("estadoCardBot").textContent =
        configuracion.botActivo
        ? "ON"
        : "OFF";

    const switchBot = document.getElementById("botSwitch");

    if(configuracion.botActivo){
        switchBot.classList.add("activo");
    }else{
        switchBot.classList.remove("activo");
    }

    const nombreSistema =
        configuracion.nombreSistema || "Boletera Admin";

    document.getElementById("nombreSistemaSidebar").textContent =
        `🎟️ ${nombreSistema}`;

    document.getElementById("nombreSistemaTitulo").textContent =
        nombreSistema;
}


async function cambiarEstadoBot(){

    const respuesta = await fetch(
        `${API_URL}/api/configuracion/bot/toggle`,
        {
            method: "PATCH"
        }
    );

    const resultado =
        await respuesta.json();

     mostrarToast(resultado.mensaje, "success");

    cargarConfiguracion();
}


function abrirEditarNombreSistema(){

    const nombreActual =
        document.getElementById("nombreSistemaTitulo").textContent;

    document.getElementById("inputNombreSistema").value =
        nombreActual;

    document
        .getElementById("modalEditarNombreSistema")
        .classList
        .remove("oculto");
}


function cerrarEditarNombreSistema(){

    document
        .getElementById("modalEditarNombreSistema")
        .classList
        .add("oculto");
}


async function guardarNombreSistema(boton){

    iniciarCarga(boton, "Guardando...");

    const nombreSistema =
        document.getElementById("inputNombreSistema").value;

    const respuesta = await fetch(
        `${API_URL}/api/configuracion/nombre`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nombreSistema })
        }
    );

    const resultado =
        await respuesta.json();

     mostrarToast(resultado.mensaje, "success");

    cerrarEditarNombreSistema();

    cargarConfiguracion();

    terminarCarga(boton);
}
