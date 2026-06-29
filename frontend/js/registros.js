/* ============================================================

   ALPHA v1.4: MOTOR DE REGISTROS

   RESPONSABILIDAD:
   - Centralizar tipos operativos.
   - Abrir formulario genérico para todos los tipos no boleteros.
   - Guardar registros en backend usando /api/registros.
   - Mantener Función con el flujo actual de evento/función.
   - Preparar timeline y checklist base.

============================================================ */

const TIPOS_REGISTRO = {
    funcion: {
        icono: "🎭",
        nombre: "Función",
        clase: "tipo-funcion",
        descripcion: "Obra o presentación abierta al público."
    },
    activacion: {
        icono: "📍",
        nombre: "Activación",
        clase: "tipo-activacion",
        descripcion: "Marca, plaza o evento promocional."
    },
    clase: {
        icono: "🎓",
        nombre: "Clase",
        clase: "tipo-clase",
        descripcion: "Taller, curso, masterclass o capacitación."
    },
    ensayo: {
        icono: "🎤",
        nombre: "Ensayo",
        clase: "tipo-ensayo",
        descripcion: "Preparación artística o técnica."
    },
    grabacion: {
        icono: "🎬",
        nombre: "Grabación",
        clase: "tipo-grabacion",
        descripcion: "Video, streaming, contenido o sesión."
    },
    especial: {
        icono: "🎪",
        nombre: "Evento especial",
        clase: "tipo-especial",
        descripcion: "Actividad única o evento no recurrente."
    },
    traslado: {
        icono: "🚚",
        nombre: "Traslado",
        clase: "tipo-traslado",
        descripcion: "Equipo, staff, utilería o logística."
    },
    mantenimiento: {
        icono: "🛠️",
        nombre: "Mantenimiento",
        clase: "tipo-mantenimiento",
        descripcion: "Reparaciones o revisión técnica."
    }
};

function abrirSelectorNuevoRegistro(){

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalNuevoRegistro")
        .classList
        .remove("oculto");
}

function cerrarSelectorNuevoRegistro(){

    const modal =
        document.getElementById("modalNuevoRegistro");

    if(modal){
        modal.classList.add("oculto");
    }

    document.body.classList.remove("modal-abierto");
}

// Alias para mantener compatibilidad con botones existentes.
function abrirModalNuevoRegistro(){ abrirSelectorNuevoRegistro(); }
function cerrarModalNuevoRegistro(){ cerrarSelectorNuevoRegistro(); }

function seleccionarTipoRegistro(tipo){

    if(tipo === "funcion"){

        document
            .getElementById("modalNuevoRegistro")
            .classList
            .add("oculto");

        mostrarSeccion("eventos");
        abrirModalNuevoEvento();
        return;
    }

    document
        .getElementById("modalNuevoRegistro")
        .classList
        .add("oculto");

    abrirModalRegistroGenerico(tipo);
}

function abrirModalRegistroGenerico(tipo){

    const info =
        TIPOS_REGISTRO[tipo] || TIPOS_REGISTRO.activacion;

    limpiarFormularioRegistroGenerico();

    document.getElementById("registroGenericoTipo").value =
        tipo;

    document.getElementById("registroGenericoIcono").textContent =
        info.icono;

    document.getElementById("registroGenericoTitulo").textContent =
        `Nuevo registro · ${info.nombre}`;

    document.getElementById("registroGenericoDescripcion").textContent =
        info.descripcion;

    document.getElementById("registroGenericoPreviewIcono").textContent =
        info.icono;

    document.getElementById("registroGenericoPreviewTitulo").textContent =
        `${info.nombre} operativo`;

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalRegistroGenerico")
        .classList
        .remove("oculto");
}

function cerrarModalRegistroGenerico(){

    document
        .getElementById("modalRegistroGenerico")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

function limpiarFormularioRegistroGenerico(){

    [
        "registroGenericoTipo",
        "registroGenericoNombre",
        "registroGenericoLugar",
        "registroGenericoFecha",
        "registroGenericoHora",
        "registroGenericoContacto",
        "registroGenericoTelefono",
        "registroGenericoNotas"
    ].forEach(id => {
        const campo =
            document.getElementById(id);

        if(campo){
            campo.value = "";
        }
    });
}

async function guardarRegistroGenerico(){

    const tipo =
        document.getElementById("registroGenericoTipo").value;

    const nombre =
        document.getElementById("registroGenericoNombre").value.trim();

    const lugar =
        document.getElementById("registroGenericoLugar").value.trim();

    const fecha =
        document.getElementById("registroGenericoFecha").value;

    const hora =
        document.getElementById("registroGenericoHora").value;

    const contacto =
        document.getElementById("registroGenericoContacto").value.trim();

    const telefono =
        document.getElementById("registroGenericoTelefono").value.trim();

    const notas =
        document.getElementById("registroGenericoNotas").value.trim();

    if(!nombre || !lugar || !fecha || !hora){
        mostrarToast("Completa nombre, lugar, fecha y hora", "warning");
        return;
    }

    const respuesta =
        await fetch(`${API_URL}/api/registros`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tipoRegistro: tipo,
                nombre,
                lugar,
                fecha,
                hora,
                contacto,
                telefono,
                notas
            })
        });

    const resultado =
        await respuesta.json();

    if(!respuesta.ok){
        mostrarToast(resultado.mensaje || "No se pudo guardar", "error");
        return;
    }

    cerrarModalRegistroGenerico();

    mostrarToast(resultado.mensaje || "Registro guardado", "success");

    cargarEventos();

    mostrarSeccion("funciones");
}

function obtenerTipoRegistroVisual(funcion){

    const tipo =
        funcion.tipoRegistro || "funcion";

    return TIPOS_REGISTRO[tipo] || TIPOS_REGISTRO.funcion;
}

function obtenerTipoRegistroDesdeEvento(evento, funcion){

    return (
        funcion?.tipoRegistro ||
        evento?.tipoRegistro ||
        "funcion"
    );
}

/* ============================================================
   ALPHA v1.4.1: CONFIGURACION DE DRAWER POR TIPO

   Nota:
   - No cambia la forma en que Función guarda boletaje.
   - Solo centraliza cómo se muestran los registros operativos.
============================================================ */

const DRAWER_REGISTRO_CONFIG = {
    activacion: {
        titulo: "Detalle de activación",
        campos: [
            { icono: "👤", etiqueta: "Contacto", key: "contacto" },
            { icono: "📱", etiqueta: "Teléfono", key: "telefono" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de activación"
    },

    clase: {
        titulo: "Detalle de clase",
        campos: [
            { icono: "👤", etiqueta: "Contacto", key: "contacto" },
            { icono: "📍", etiqueta: "Sede", key: "lugarEvento" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de clase"
    },

    ensayo: {
        titulo: "Detalle de ensayo",
        campos: [
            { icono: "👤", etiqueta: "Responsable", key: "contacto" },
            { icono: "📍", etiqueta: "Lugar", key: "lugarEvento" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de ensayo"
    },

    grabacion: {
        titulo: "Detalle de grabación",
        campos: [
            { icono: "👤", etiqueta: "Contacto", key: "contacto" },
            { icono: "📱", etiqueta: "Teléfono", key: "telefono" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de grabación"
    },

    especial: {
        titulo: "Detalle de evento especial",
        campos: [
            { icono: "👤", etiqueta: "Contacto", key: "contacto" },
            { icono: "📍", etiqueta: "Lugar", key: "lugarEvento" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de evento especial"
    },

    traslado: {
        titulo: "Detalle de traslado",
        campos: [
            { icono: "👤", etiqueta: "Responsable", key: "contacto" },
            { icono: "📱", etiqueta: "Teléfono", key: "telefono" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de traslado"
    },

    mantenimiento: {
        titulo: "Detalle de mantenimiento",
        campos: [
            { icono: "👤", etiqueta: "Responsable", key: "contacto" },
            { icono: "📱", etiqueta: "Teléfono", key: "telefono" },
            { icono: "📝", etiqueta: "Notas", key: "notas" }
        ],
        checklistTitulo: "Checklist de mantenimiento"
    }
};

function obtenerValorRegistroDrawer(evento, funcion, key){

    if(key === "lugarEvento"){
        return evento?.lugar || "";
    }

    return funcion?.[key] || evento?.[key] || "";
}

function crearFilaDetalleRegistro(icono, etiqueta, valor){

    if(!valor){
        return "";
    }

    return `
        <div class="agenda-categoria-mini agenda-detalle-row">
            <span>${icono} ${escaparTexto(etiqueta)}</span>
            <strong>${escaparTexto(valor)}</strong>
        </div>
    `;
}

function crearChecklistRegistroAgenda(evento, funcion, tipoRegistro){

    const config = DRAWER_REGISTRO_CONFIG[tipoRegistro];
    const checklist = funcion?.checklist || evento?.checklist || [];
    const titulo = config?.checklistTitulo || "Checklist";

    const items = Array.isArray(checklist) && checklist.length > 0
        ? checklist.map((item, index) => {
            const texto = typeof item === "string" ? item : item.texto || item.nombre || "";
            const itemId = Number(item.id || index + 1);
            const completado = Boolean(item.completado);

            return `
                <div class="agenda-checklist-editable-item ${completado ? "completado" : ""}">
                    <button class="agenda-checklist-toggle" onclick="toggleChecklistRegistroAgenda(${evento.id}, ${funcion.id}, ${itemId}, this)" title="Marcar / desmarcar">
                        ${completado ? "☑" : "☐"}
                    </button>

                    <strong>${escaparTexto(texto)}</strong>

                    <button class="agenda-checklist-action" onclick="editarItemChecklistRegistro(${evento.id}, ${funcion.id}, ${itemId}, '${escaparTexto(texto)}')" title="Editar">
                        ✏️
                    </button>

                    <button class="agenda-checklist-action danger" onclick="eliminarItemChecklistRegistro(${evento.id}, ${funcion.id}, ${itemId})" title="Eliminar">
                        🗑️
                    </button>
                </div>
            `;
        }).join("")
        : `<div class="agenda-checklist-empty">Agrega cosas que debas llevar o preparar.</div>`;

    return `
        <div class="agenda-drawer-bloque">
            <h4>${escaparTexto(titulo)}</h4>

            <div class="agenda-checklist-add">
                <input id="nuevoChecklistTexto-${evento.id}-${funcion.id}" placeholder="Ej. Cable HDMI, vestuario, contrato...">
                <button onclick="agregarItemChecklistRegistro(${evento.id}, ${funcion.id})">+ Agregar</button>
            </div>

            <div class="agenda-checklist-lista">
                ${items}
            </div>
        </div>
    `;
}
function crearTimelineRegistroAgenda(evento, funcion){

    const timeline =
        funcion?.timeline || evento?.timeline || [];

    if(!Array.isArray(timeline) || timeline.length === 0){
        return "";
    }

    const ultimo =
        timeline[timeline.length - 1];

    const mensaje =
        ultimo.mensaje || "Registro actualizado";

    return `
        <div class="agenda-timeline-mini">
            <span>🕓 Último movimiento</span>
            <strong>${escaparTexto(mensaje)}</strong>
        </div>
    `;
}

function crearDetalleOperativoAgenda(evento, funcion){

    const tipoRegistro =
        funcion?.tipoRegistro || evento?.tipoRegistro || "activacion";

    const tipoVisual =
        TIPOS_REGISTRO[tipoRegistro] || TIPOS_REGISTRO.activacion;

    const config =
        DRAWER_REGISTRO_CONFIG[tipoRegistro] || DRAWER_REGISTRO_CONFIG.activacion;

    let html = `
        <div class="agenda-drawer-bloque">
            <h4>${escaparTexto(config.titulo)}</h4>

            <div class="agenda-categoria-mini agenda-detalle-row">
                <span>${tipoVisual.icono} Tipo</span>
                <strong>${escaparTexto(tipoVisual.nombre)}</strong>
            </div>
        </div>
    `;

    const campos =
        config.campos || [];

    const filas =
        campos.map(campo => {
            const valor =
                obtenerValorRegistroDrawer(evento, funcion, campo.key);

            return crearFilaDetalleRegistro(
                campo.icono,
                campo.etiqueta,
                valor
            );
        }).join("");

    if(filas){
        html += `
            <div class="agenda-drawer-bloque">
                <h4>Información</h4>
                ${filas}
            </div>
        `;
    }

    html += crearChecklistRegistroAgenda(
        evento,
        funcion,
        tipoRegistro
    );

    html += crearTimelineRegistroAgenda(
        evento,
        funcion
    );

    return html;
}

/* ============================================================
   ALPHA v1.4.2: TOGGLE DE CHECKLIST (puente front <-> backend)

   Faltaba esta función: el botón del checklist la llamaba pero
   no estaba definida. Hace el PATCH al endpoint y actualiza el
   ítem en el momento (sin recargar el drawer ni perder scroll).
============================================================ */

async function toggleChecklistRegistroAgenda(eventoId, funcionId, itemId, boton){

    try{

        const respuesta =
            await fetch(
                `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/checklist/${itemId}/toggle`,
                { method: "PATCH" }
            );

        if(!respuesta.ok){
            mostrarToast("No se pudo actualizar el checklist.", "error");
            return;
        }

        // Actualización optimista, acorde a la estructura v1.4.3:
        // el ícono ☐/☑ es el texto del propio botón y la clase
        // .completado vive en el contenedor del ítem (el padre).
        if(boton){

            const item =
                boton.closest(".agenda-checklist-editable-item");

            const completado =
                item
                    ? !item.classList.contains("completado")
                    : true;

            if(item){
                item.classList.toggle("completado", completado);
            }

            boton.textContent = completado ? "☑" : "☐";
        }

        // Refrescamos los datos en segundo plano para que el
        // estado y el timeline queden correctos al reabrir.
        await cargarEventos();

    }catch(error){
        mostrarToast("Error de conexión al actualizar el checklist.", "error");
    }
}

/* ============================================================
   ALPHA v1.4.3: CHECKLIST EDITABLE POR USUARIO
============================================================ */

async function agregarItemChecklistRegistro(eventoId, funcionId){
    const input = document.getElementById(`nuevoChecklistTexto-${eventoId}-${funcionId}`);
    const texto = input?.value?.trim();

    if(!texto){
        mostrarToast("Escribe el pendiente", "warning");
        return;
    }

    const respuesta = await fetch(`${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto })
    });

    const resultado = await respuesta.json();

    if(!respuesta.ok){
        mostrarToast(resultado.mensaje || "No se pudo agregar", "error");
        return;
    }

    mostrarToast(resultado.mensaje || "Pendiente agregado", "success");
    await refrescarDrawerChecklist(eventoId, funcionId);
}

function editarItemChecklistRegistro(eventoId, funcionId, itemId, textoActual){

    abrirPrompt(
        "Editar pendiente",
        textoActual,
        async function(nuevoTexto){

            const respuesta =
                await fetch(
                    `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/checklist/${itemId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ texto: nuevoTexto })
                    }
                );

            const resultado =
                await respuesta.json();

            if(!respuesta.ok){
                mostrarToast(resultado.mensaje || "No se pudo editar", "error");
                return;
            }

            mostrarToast(resultado.mensaje || "Pendiente actualizado", "success");
            await refrescarDrawerChecklist(eventoId, funcionId);
        }
    );
}

function eliminarItemChecklistRegistro(eventoId, funcionId, itemId){

    abrirConfirmacion(
        "Eliminar pendiente",
        "¿Seguro que quieres eliminar este pendiente?",
        async function(){

            const respuesta =
                await fetch(
                    `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/checklist/${itemId}`,
                    { method: "DELETE" }
                );

            const resultado =
                await respuesta.json();

            if(!respuesta.ok){
                mostrarToast(resultado.mensaje || "No se pudo eliminar", "error");
                return;
            }

            mostrarToast(resultado.mensaje || "Pendiente eliminado", "success");
            await refrescarDrawerChecklist(eventoId, funcionId);
        }
    );
}

async function refrescarDrawerChecklist(eventoId, funcionId){

    await cargarEventos();

    const evento =
        eventosActuales.find(item => Number(item.id) === Number(eventoId));

    const funcion =
        evento?.funciones?.find(item => Number(item.id) === Number(funcionId));

    const contenedor =
        document.getElementById("agendaDrawerFunciones");

    if(!funcion?.fecha || !contenedor){
        return;
    }

    // Repintamos TODOS los registros de ese día con datos frescos,
    // directo en el contenedor del drawer (sin reabrir el modal).
    const delDia =
        (typeof agruparFuncionesPorFecha === "function")
            ? (agruparFuncionesPorFecha(eventosActuales)[funcion.fecha] || [])
            : [];

    contenedor.innerHTML = "";

    delDia
        .sort((a, b) => String(a.funcion.hora).localeCompare(String(b.funcion.hora)))
        .forEach(item => {
            contenedor.innerHTML +=
                crearFuncionAgendaCard(item.evento, item.funcion);
        });
}