/* =============================
   UI GENERAL
   ============================= */


function mostrarToast(
    mensaje,
    tipo = "success"
){

    const toast =
        document.getElementById("toast");

    const texto =
        document.getElementById("toastMensaje");

    const icono =
        document.getElementById("toastIcon");

    texto.textContent = mensaje;

    if(tipo === "success"){
        icono.textContent = "✅";
    }

    if(tipo === "error"){
        icono.textContent = "❌";
    }

    if(tipo === "warning"){
        icono.textContent = "⚠️";
    }

    toast.classList.remove("oculto");

    toast.classList.remove(
        "toast-success",
        "toast-error",
        "toast-warning"
    );

    toast.classList.add(
        `toast-${tipo}`
    );

    setTimeout(() => {

        toast.classList.add(
            "oculto"
        );

    }, 3000);
}


function mostrarSeccion(seccion){
    const secciones = ["Dashboard", "Eventos", "Funciones", "Ventas", "Configuracion"];

    secciones.forEach(nombre => {
        const bloque = document.getElementById(`seccion${nombre}`);
        const menu = document.getElementById(`menu${nombre}`);

        if(bloque){ bloque.classList.add("oculto"); }
        if(menu){ menu.classList.remove("active"); }
    });

    const nombreSeccion = seccion.charAt(0).toUpperCase() + seccion.slice(1);
    const bloqueActivo = document.getElementById(`seccion${nombreSeccion}`);
    const menuActivo = document.getElementById(`menu${nombreSeccion}`);

    if(bloqueActivo){ bloqueActivo.classList.remove("oculto"); }
    if(menuActivo){ menuActivo.classList.add("active"); }
}

function toggleCamposCategoria(switchId, contenedorId){
    const activo = document.getElementById(switchId)?.checked;
    const contenedor = document.getElementById(contenedorId);

    if(!contenedor){ return; }

    if(activo){
        contenedor.classList.remove("oculto");
    }else{
        contenedor.classList.add("oculto");
    }
}
