/* =============================
   MODULO EVENTOS
   ============================= */


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
    crearHTMLDescuentos(
        funcion.descuentos,
        evento.id,
        funcion.id
    );

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
