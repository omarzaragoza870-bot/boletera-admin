
function mostrarSeccion(seccion){
    const secciones=["Dashboard","Eventos","Funciones","Ventas","Configuracion","NuevoRegistro"];
    secciones.forEach(nombre=>{const el=document.getElementById(`seccion${nombre}`);if(el){el.classList.add("oculto");}});
    const menus=["Dashboard","Eventos","Funciones","Ventas","Configuracion"];
    menus.forEach(nombre=>{const el=document.getElementById(`menu${nombre}`);if(el){el.classList.remove("active");}});
    if(seccion==="dashboard"){document.getElementById("seccionDashboard").classList.remove("oculto");document.getElementById("menuDashboard").classList.add("active");}
    if(seccion==="eventos"){document.getElementById("seccionEventos").classList.remove("oculto");document.getElementById("menuEventos").classList.add("active");}
    if(seccion==="funciones"){document.getElementById("seccionFunciones").classList.remove("oculto");document.getElementById("menuFunciones").classList.add("active");}
    if(seccion==="ventas"){document.getElementById("seccionVentas").classList.remove("oculto");document.getElementById("menuVentas").classList.add("active");}
    if(seccion==="configuracion"){document.getElementById("seccionConfiguracion").classList.remove("oculto");document.getElementById("menuConfiguracion").classList.add("active");}
    if(seccion==="nuevoRegistro"){document.getElementById("seccionNuevoRegistro").classList.remove("oculto");document.getElementById("menuFunciones").classList.add("active");}
}
