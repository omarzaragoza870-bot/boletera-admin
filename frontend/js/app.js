const API_URL = "";

let descuentosTemporales = [];
let eventosActuales = [];

function escaparTexto(texto){
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerCategorias(funcion){

    if(funcion.categorias){
        return funcion.categorias;
    }

    return {
        general: {
            preventa: Number(funcion.precio || 0),
            precio: Number(funcion.precio || 0),
            boletos: Number(funcion.boletosDisponibles || 0)
        },

        preferente: {
            activa: false,
            preventa: 0,
            precio: 0,
            boletos: 0
        },

        vip: {
            activa: false,
            preventa: 0,
            precio: 0,
            boletos: 0
        }
    };
}

function calcularBoletosFuncion(funcion){

    const categorias = obtenerCategorias(funcion);

    let total =
        Number(categorias.general?.boletos || 0);

    if(categorias.preferente?.activa){
        total +=
            Number(categorias.preferente?.boletos || 0);
    }

    if(categorias.vip?.activa){
        total +=
            Number(categorias.vip?.boletos || 0);
    }

    return total;
}

function crearHTMLCategoria(
    titulo,
    icono,
    categoria
){

    return `
        <div class="categoria-card">

            <h4>${icono} ${titulo}</h4>

            <p>
                Preventa:
                $${Number(categoria?.preventa || 0)}
            </p>

            <p>
                Regular:
                $${Number(categoria?.precio || 0)}
            </p>

            <p>
                Boletos:
                ${Number(categoria?.boletos || 0)}
            </p>

        </div>
    `;
}

function agregarDescuentoTemp(){

    const codigo =
        document.getElementById("codigoDescuento").value.trim();

    const tipo =
        document.getElementById("tipoDescuento").value;

    const valor =
        Number(document.getElementById("valorDescuento").value);

    if(!codigo || !valor){
        mostrarToast("Completa código y valor del descuento", "warning");
        return;
    }

    descuentosTemporales.push({
        codigo,
        tipo,
        valor,
        activo: true
    });

    document.getElementById("codigoDescuento").value = "";
    document.getElementById("valorDescuento").value = "";

    pintarDescuentosTemp();
}

function pintarDescuentosTemp(){

    const contenedor =
        document.getElementById("listaDescuentos");

    if(!contenedor){
        return;
    }

    contenedor.innerHTML = "";

    descuentosTemporales.forEach((descuento, index) => {

        contenedor.innerHTML += `
            <div class="descuento-chip">
                ${descuento.codigo} - ${
                    descuento.tipo === "porcentaje"
                    ? `${descuento.valor}%`
                    : `$${descuento.valor}`
                }

                <button
                    type="button"
                    onclick="eliminarDescuentoTemp(${index})">

                    ×

                </button>
            </div>
        `;
    });
}

function eliminarDescuentoTemp(index){

    descuentosTemporales.splice(index, 1);

    pintarDescuentosTemp();
}

function crearHTMLDescuentos(descuentos){

    if(!descuentos || descuentos.length === 0){
        return "";
    }

    let descuentosHTML = "";

    descuentos.forEach(descuento => {

        descuentosHTML += `
            <div class="descuento-chip">
                🎁 ${escaparTexto(descuento.codigo)} - ${
                    descuento.tipo === "porcentaje"
                    ? `${Number(descuento.valor || 0)}%`
                    : `$${Number(descuento.valor || 0)}`
                }
            </div>
        `;
    });

    return `
        <div class="descuentos-funcion">
            <h4>🎁 Descuentos</h4>

            <div class="descuentos-lista">
                ${descuentosHTML}
            </div>
        </div>
    `;
}

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

async function cargarEventos(){

    const respuesta = await fetch(`${API_URL}/api/eventos`);
    const eventos = await respuesta.json();

    eventosActuales = eventos;

    const textoBusqueda =
        document
            .getElementById("buscadorEventos")
            ?.value
            ?.toLowerCase() || "";

    const contenedor = document.getElementById("listaEventos");

    contenedor.innerHTML = "";

    let totalFunciones = 0;
    let totalBoletos = 0;

    const eventosFiltrados = eventos.filter(evento =>
        evento.nombre
            .toLowerCase()
            .includes(textoBusqueda)
    );

    eventos.forEach(evento => {
        evento.funciones.forEach(funcion => {
            totalFunciones++;
            totalBoletos += calcularBoletosFuncion(funcion);
        });
    });

    if(eventosFiltrados.length === 0){
        contenedor.innerHTML = `
            <div class="empty-state">
                No hay eventos que coincidan con la búsqueda.
            </div>
        `;
    }

    eventosFiltrados.forEach(evento => {

        let funcionesHTML = "";

        evento.funciones.forEach(funcion => {

            const categorias = obtenerCategorias(funcion);

            let categoriasHTML = "";

            categoriasHTML += crearHTMLCategoria(
                "General",
                "🎫",
                categorias.general
            );

            if(categorias.preferente?.activa){
                categoriasHTML += crearHTMLCategoria(
                    "Preferente",
                    "🎟️",
                    categorias.preferente
                );
            }

            if(categorias.vip?.activa){
                categoriasHTML += crearHTMLCategoria(
                    "VIP",
                    "⭐",
                    categorias.vip
                );
            }

            const descuentosHTML =
                crearHTMLDescuentos(funcion.descuentos);

            funcionesHTML += `
                <div class="funcion">

                    <div class="funcion-grid">

                        <div class="funcion-item">
                            <span class="funcion-label">Fecha</span>
                            📅 ${escaparTexto(funcion.fecha)}
                        </div>

                        <div class="funcion-item">
                            <span class="funcion-label">Hora</span>
                            ⏰ ${escaparTexto(funcion.hora)}
                        </div>

                    </div>

                    <div class="categorias-grid">
                        ${categoriasHTML}
                    </div>

                    ${descuentosHTML}

                    <p class="${funcion.activa ? "status-ok" : "status-off"}">
                        ${funcion.activa ? "🟢 Función activa" : "🔴 Función inactiva"}
                    </p>

                    <div class="acciones-funcion">

                        <button
                            class="btn-secundario btn-icon"
                            title="${funcion.activa ? "Desactivar función" : "Activar función"}"
                            onclick="toggleFuncion(${evento.id}, ${funcion.id})">

                            ${funcion.activa ? "⏸️" : "▶️"}

                        </button>

                        <button
                            class="btn-secundario btn-icon"
                            title="Editar función"
                            onclick="abrirEditarFuncion(${evento.id}, ${funcion.id})">

                            ✏️

                        </button>

                        <button
                            class="btn-danger btn-icon"
                            title="Eliminar función"
                            onclick="eliminarFuncion(${evento.id}, ${funcion.id})">

                            🗑️

                        </button>

                    </div>

                </div>
            `;
        });

        contenedor.innerHTML += `
            <div class="evento">

                ${
                    evento.imagen
                    ? `<img class="evento-imagen" src="${escaparTexto(evento.imagen)}" alt="${escaparTexto(evento.nombre)}">`
                    : `<div class="evento-imagen-placeholder">Sin imagen</div>`
                }

                <div class="evento-header">
                    <div>
                        <h3>${escaparTexto(evento.nombre)}</h3>
                        <p class="evento-meta">📍 ${escaparTexto(evento.lugar)}</p>
                        <p class="${evento.activo ? "status-ok" : "status-off"}">
                            ${evento.activo ? "🟢 Evento activo" : "🔴 Evento inactivo"}
                        </p>
                    </div>

                    <div class="acciones-evento">
                        <button
                            class="btn-secundario btn-icon"
                            title="Editar evento"
                            onclick="abrirEditarEvento(
                                ${evento.id},
                                '${escaparTexto(evento.nombre)}',
                                '${escaparTexto(evento.lugar)}',
                                '${escaparTexto(evento.imagen || "")}'
                            )">

                            ✏️

                        </button>

                        <button
                            class="btn-secundario btn-icon"
                            title="Agregar función"
                            onclick="abrirModalFuncion(${evento.id})">

                            ➕

                        </button>

                        <button
                            class="btn-danger btn-icon"
                            title="${evento.activo ? "Desactivar evento" : "Activar evento"}"
                            onclick="cambiarEstadoEvento(${evento.id})">

                            ${evento.activo ? "⏸️" : "▶️"}

                        </button>

                        <button
                            class="btn-danger btn-icon"
                            title="Eliminar evento"
                            onclick="eliminarEvento(${evento.id})">

                            🗑️

                        </button>
                    </div>
                </div>

                <div class="funciones-lista">
                    ${funcionesHTML || `
                        <div class="empty-state">
                            Este evento todavía no tiene funciones.
                        </div>
                    `}
                </div>
            </div>
        `;
    });

    document.getElementById("totalEventos").textContent = eventos.length;
    document.getElementById("totalFunciones").textContent = totalFunciones;
    document.getElementById("totalBoletos").textContent = totalBoletos;
}

function abrirModalNuevoEvento(){

    descuentosTemporales = [];
    pintarDescuentosTemp();

    document.getElementById("nombre").value = "";
    document.getElementById("lugar").value = "";
    document.getElementById("imagen").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("hora").value = "";

    document.getElementById("generalPreventa").value = "";
    document.getElementById("generalPrecio").value = "";
    document.getElementById("generalBoletos").value = "";

    document.getElementById("activarPreferente").checked = false;
    document.getElementById("preferentePreventa").value = "";
    document.getElementById("preferentePrecio").value = "";
    document.getElementById("preferenteBoletos").value = "";

    document.getElementById("activarVip").checked = false;
    document.getElementById("vipPreventa").value = "";
    document.getElementById("vipPrecio").value = "";
    document.getElementById("vipBoletos").value = "";

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalNuevoEvento")
        .classList
        .remove("oculto");
}

function cerrarModalNuevoEvento(){
    
    document
        .getElementById("modalNuevoEvento")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");    
}

async function crearEvento(boton){

    iniciarCarga(boton, "Guardando...");

    const evento = {
        nombre: document.getElementById("nombre").value,
        lugar: document.getElementById("lugar").value,
        imagen: document.getElementById("imagen").value,
        fecha: document.getElementById("fecha").value,
        hora: document.getElementById("hora").value,
        descuentos: [...descuentosTemporales],

        categorias: {
            general: {
                preventa: Number(
                    document.getElementById("generalPreventa").value
                ),
                precio: Number(
                    document.getElementById("generalPrecio").value
                ),
                boletos: Number(
                    document.getElementById("generalBoletos").value
                )
            },

            preferente: {
                activa:
                    document.getElementById("activarPreferente").checked,
                preventa: Number(
                    document.getElementById("preferentePreventa").value
                ),
                precio: Number(
                    document.getElementById("preferentePrecio").value
                ),
                boletos: Number(
                    document.getElementById("preferenteBoletos").value
                )
            },

            vip: {
                activa:
                    document.getElementById("activarVip").checked,
                preventa: Number(
                    document.getElementById("vipPreventa").value
                ),
                precio: Number(
                    document.getElementById("vipPrecio").value
                ),
                boletos: Number(
                    document.getElementById("vipBoletos").value
                )
            }
        }
    };

    const respuesta = await fetch(`${API_URL}/api/eventos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(evento)
    });

    const resultado = await respuesta.json();

     mostrarToast(resultado.mensaje, "success");

    document.getElementById("nombre").value = "";
    document.getElementById("lugar").value = "";
    document.getElementById("imagen").value = "";
    document.getElementById("fecha").value = "";
    document.getElementById("hora").value = "";

    document.getElementById("generalPreventa").value = "";
    document.getElementById("generalPrecio").value = "";
    document.getElementById("generalBoletos").value = "";

    document.getElementById("activarPreferente").checked = false;
    document.getElementById("preferentePreventa").value = "";
    document.getElementById("preferentePrecio").value = "";
    document.getElementById("preferenteBoletos").value = "";

    document.getElementById("activarVip").checked = false;
    document.getElementById("vipPreventa").value = "";
    document.getElementById("vipPrecio").value = "";
    document.getElementById("vipBoletos").value = "";

    descuentosTemporales = [];
    pintarDescuentosTemp();

    cerrarModalNuevoEvento();

    cargarEventos();

    terminarCarga(boton);
}

async function cambiarEstadoEvento(id){

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${id}/toggle`,
        {
            method: "PATCH"
        }
    );

    const resultado = await respuesta.json();

     mostrarToast(resultado.mensaje, "success");

    cargarEventos();
}

function abrirModalFuncion(eventoId){

    document.getElementById("eventoIdFuncion").value = eventoId;

    document.getElementById("fechaFuncion").value = "";
    document.getElementById("horaFuncion").value = "";

    document.getElementById("generalPreventaFuncion").value = "";
    document.getElementById("generalPrecioFuncion").value = "";
    document.getElementById("generalBoletosFuncion").value = "";

    document.getElementById("activarPreferenteFuncion").checked = false;
    document.getElementById("preferentePreventaFuncion").value = "";
    document.getElementById("preferentePrecioFuncion").value = "";
    document.getElementById("preferenteBoletosFuncion").value = "";

    document.getElementById("activarVipFuncion").checked = false;
    document.getElementById("vipPreventaFuncion").value = "";
    document.getElementById("vipPrecioFuncion").value = "";
    document.getElementById("vipBoletosFuncion").value = "";

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalFuncion")
        .classList
        .remove("oculto");
}

function cerrarModalFuncion(){

    document
        .getElementById("modalFuncion")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

async function guardarFuncion(boton){

    iniciarCarga(boton, "Guardando...");

    const eventoId =
        document.getElementById("eventoIdFuncion").value;

    const categorias = {
        general: {
            preventa: Number(
                document.getElementById("generalPreventaFuncion").value
            ),
            precio: Number(
                document.getElementById("generalPrecioFuncion").value
            ),
            boletos: Number(
                document.getElementById("generalBoletosFuncion").value
            )
        },

        preferente: {
            activa:
                document.getElementById("activarPreferenteFuncion").checked,
            preventa: Number(
                document.getElementById("preferentePreventaFuncion").value
            ),
            precio: Number(
                document.getElementById("preferentePrecioFuncion").value
            ),
            boletos: Number(
                document.getElementById("preferenteBoletosFuncion").value
            )
        },

        vip: {
            activa:
                document.getElementById("activarVipFuncion").checked,
            preventa: Number(
                document.getElementById("vipPreventaFuncion").value
            ),
            precio: Number(
                document.getElementById("vipPrecioFuncion").value
            ),
            boletos: Number(
                document.getElementById("vipBoletosFuncion").value
            )
        }
    };

    const boletosTotales =
        categorias.general.boletos +
        (
            categorias.preferente.activa
            ? categorias.preferente.boletos
            : 0
        ) +
        (
            categorias.vip.activa
            ? categorias.vip.boletos
            : 0
        );

    const nuevaFuncion = {
        fecha: document.getElementById("fechaFuncion").value,
        hora: document.getElementById("horaFuncion").value,

        categorias,

        descuentos: [],

        precio: categorias.general.precio,
        boletosDisponibles: boletosTotales
    };

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${eventoId}/funciones`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(nuevaFuncion)
        }
    );

    const resultado = await respuesta.json();

    mostrarToast(resultado.mensaje, "success");

    cerrarModalFuncion();

    cargarEventos();

    terminarCarga(boton);
}

async function toggleFuncion(eventoId, funcionId){

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/toggle`,
        {
            method:"PATCH"
        }
    );

    const resultado = await respuesta.json();

     mostrarToast(resultado.mensaje, "success");

    cargarEventos();
}

let accionConfirmada = null;

function abrirConfirmacion(titulo, mensaje, accion){

    document.getElementById("confirmacionTitulo").textContent =
        titulo;

    document.getElementById("confirmacionMensaje").textContent =
        mensaje;

    accionConfirmada = accion;

    document
        .getElementById("modalConfirmacion")
        .classList
        .remove("oculto");
}

function cerrarConfirmacion(){

    accionConfirmada = null;

    document
        .getElementById("modalConfirmacion")
        .classList
        .add("oculto");
}

document
    .getElementById("btnConfirmarAccion")
    .addEventListener("click", async function(){

        if(accionConfirmada){
            await accionConfirmada();
        }

        cerrarConfirmacion();
    });

async function eliminarFuncion(eventoId, funcionId){

    abrirConfirmacion(
        "Eliminar función",
        "¿Seguro que quieres eliminar esta función?",
        async function(){

            const respuesta = await fetch(
                `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}`,
                {
                    method: "DELETE"
                }
            );

            const resultado = await respuesta.json();

             mostrarToast(resultado.mensaje, "success");

            cargarEventos();
        }
    );
}

function abrirEditarFuncion(eventoId, funcionId){

    const evento = eventosActuales.find(
        item => item.id === eventoId
    );

    if(!evento){
        mostrarToast("Evento no encontrado", "error");
        return;
    }

    const funcion = evento.funciones.find(
        item => item.id === funcionId
    );

    if(!funcion){
        mostrarToast("Función no encontrada", "error");
        return;
    }

    const categorias = obtenerCategorias(funcion);

    document.getElementById("editarEventoId").value =
        eventoId;

    document.getElementById("editarFuncionId").value =
        funcionId;

    document.getElementById("editarFecha").value =
        funcion.fecha;

    document.getElementById("editarHora").value =
        funcion.hora;

    document.getElementById("editarGeneralPreventa").value =
        categorias.general?.preventa || 0;

    document.getElementById("editarGeneralPrecio").value =
        categorias.general?.precio || 0;

    document.getElementById("editarGeneralBoletos").value =
        categorias.general?.boletos || 0;

    document.getElementById("editarPreferenteActiva").checked =
        Boolean(categorias.preferente?.activa);

    document.getElementById("editarPreferentePreventa").value =
        categorias.preferente?.preventa || 0;

    document.getElementById("editarPreferentePrecio").value =
        categorias.preferente?.precio || 0;

    document.getElementById("editarPreferenteBoletos").value =
        categorias.preferente?.boletos || 0;

    document.getElementById("editarVipActiva").checked =
        Boolean(categorias.vip?.activa);

    document.getElementById("editarVipPreventa").value =
        categorias.vip?.preventa || 0;

    document.getElementById("editarVipPrecio").value =
        categorias.vip?.precio || 0;

    document.getElementById("editarVipBoletos").value =
        categorias.vip?.boletos || 0;

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalEditarFuncion")
        .classList
        .remove("oculto");
}

function cerrarEditarFuncion(){

    document
        .getElementById("modalEditarFuncion")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

async function guardarEdicionFuncion(boton){

    iniciarCarga(boton, "Guardando...");

    const eventoId =
        document.getElementById("editarEventoId").value;

    const funcionId =
        document.getElementById("editarFuncionId").value;

    const categorias = {
        general: {
            preventa: Number(document.getElementById("editarGeneralPreventa").value),
            precio: Number(document.getElementById("editarGeneralPrecio").value),
            boletos: Number(document.getElementById("editarGeneralBoletos").value)
        },

        preferente: {
            activa: document.getElementById("editarPreferenteActiva").checked,
            preventa: Number(document.getElementById("editarPreferentePreventa").value),
            precio: Number(document.getElementById("editarPreferentePrecio").value),
            boletos: Number(document.getElementById("editarPreferenteBoletos").value)
        },

        vip: {
            activa: document.getElementById("editarVipActiva").checked,
            preventa: Number(document.getElementById("editarVipPreventa").value),
            precio: Number(document.getElementById("editarVipPrecio").value),
            boletos: Number(document.getElementById("editarVipBoletos").value)
        }
    };

    const boletosTotales =
        categorias.general.boletos +
        (categorias.preferente.activa ? categorias.preferente.boletos : 0) +
        (categorias.vip.activa ? categorias.vip.boletos : 0);

    const datos = {
        fecha: document.getElementById("editarFecha").value,
        hora: document.getElementById("editarHora").value,
        categorias,
        precio: categorias.general.precio,
        boletosDisponibles: boletosTotales
    };

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(datos)
        }
    );

    const resultado =
        await respuesta.json();

    mostrarToast(resultado.mensaje, "success");

    cerrarEditarFuncion();

    cargarEventos();

    terminarCarga(boton);
}

async function eliminarEvento(id){

    abrirConfirmacion(
        "Eliminar evento",
        "¿Seguro que quieres eliminar este evento y todas sus funciones?",
        async function(){

            const respuesta = await fetch(
                `${API_URL}/api/eventos/${id}`,
                {
                    method:"DELETE"
                }
            );

            const resultado =
                await respuesta.json();

             mostrarToast(resultado.mensaje, "success");

            cargarEventos();
        }
    );
}

function abrirEditarEvento(
    id,
    nombre,
    lugar,
    imagen
){

    document.getElementById(
        "editarEventoIdGeneral"
    ).value = id;

    document.getElementById(
        "editarNombreEvento"
    ).value = nombre;

    document.getElementById(
        "editarLugarEvento"
    ).value = lugar;

    document.getElementById(
        "editarImagenEvento"
    ).value = imagen;

    document.getElementById(
        "modalEditarEvento"
    ).classList.remove("oculto");
}

function cerrarEditarEvento(){

    document.getElementById(
        "modalEditarEvento"
    ).classList.add("oculto");
}

async function guardarEdicionEvento(boton){

    iniciarCarga(boton, "Guardando...");

    const id =
        document.getElementById(
            "editarEventoIdGeneral"
        ).value;

    const datos = {
        nombre:
            document.getElementById(
                "editarNombreEvento"
            ).value,

        lugar:
            document.getElementById(
                "editarLugarEvento"
            ).value,

        imagen:
            document.getElementById(
                "editarImagenEvento"
            ).value
    };

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${id}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify(datos)
        }
    );

    const resultado =
        await respuesta.json();

    mostrarToast(resultado.mensaje, "success");

    cerrarEditarEvento();

    cargarEventos();

    terminarCarga(boton);
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

function iniciarCarga(boton, texto = "Guardando..."){

    boton.disabled = true;
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = texto;
}

function terminarCarga(boton){

    boton.disabled = false;
    boton.textContent = boton.dataset.textoOriginal;
}

cargarConfiguracion();
cargarEventos();