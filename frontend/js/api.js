/* =============================
   API HELPERS
   ============================= */

async function apiRequest(ruta, opciones = {}){
    const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
    return respuesta.json();
}
