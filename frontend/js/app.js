/* =============================
   ARRANQUE PRINCIPAL
   ============================= */

async function iniciarApp(){
    await cargarConfiguracion();
    await cargarEventos();
    mostrarSeccion("dashboard");
}

iniciarApp();
