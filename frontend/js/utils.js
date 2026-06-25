/* =============================
   UTILIDADES
   ============================= */


function escaparTexto(texto){
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function iniciarCarga(boton, texto = "Guardando..."){

    boton.disabled = true;
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = texto;
}


function terminarCarga(boton){

    boton.disabled = false;
    boton.textContent = boton.dataset.textoOriginal;
}


function limpiarCampo(id){
    const campo = document.getElementById(id);
    if(campo){ campo.value = ""; }
}

function limpiarCheckbox(id){
    const campo = document.getElementById(id);
    if(campo){ campo.checked = false; }
}

function ocultarElemento(id){
    const elemento = document.getElementById(id);
    if(elemento){ elemento.classList.add("oculto"); }
}

function mostrarElemento(id){
    const elemento = document.getElementById(id);
    if(elemento){ elemento.classList.remove("oculto"); }
}
