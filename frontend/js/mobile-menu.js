
function abrirMenuMovil(){
    document.body.classList.add("menu-movil-abierto");
}

function cerrarMenuMovil(){
    document.body.classList.remove("menu-movil-abierto");
}

document.addEventListener("click", function(event){
    const itemMenu = event.target.closest(".menu-item");
    if(itemMenu && window.innerWidth <= 820){
        cerrarMenuMovil();
    }
});

document.addEventListener("keydown", function(event){
    if(event.key === "Escape"){
        cerrarMenuMovil();
    }
});
