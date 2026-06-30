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


/* ============================================================
   ALPHA v1.5: ESTADO DE OPERACIÓN

   - Pendiente / Confirmado: lo guardado, antes del día.
   - En curso: automático cuando llega el día (hoy >= fecha);
     gana sobre Pendiente y Confirmado.
   - Finalizado / Cancelado: terminales, mandan siempre.
   El estado efectivo se calcula aquí al mostrar (no se guarda
   "en curso"); el backend solo guarda lo que el usuario elige.
============================================================ */

const ESTADOS_OPERACION = {
    pendiente:  { valor: "pendiente",  icono: "🟡", nombre: "Pendiente",  clase: "estado-pendiente" },
    confirmado: { valor: "confirmado", icono: "🔵", nombre: "Confirmado", clase: "estado-confirmado" },
    en_curso:   { valor: "en_curso",   icono: "🟢", nombre: "En curso",   clase: "estado-encurso" },
    finalizado: { valor: "finalizado", icono: "⚫", nombre: "Finalizado", clase: "estado-finalizado" },
    cancelado:  { valor: "cancelado",  icono: "🔴", nombre: "Cancelado",  clase: "estado-cancelado" }
};

// Fecha de hoy en formato YYYY-MM-DD (hora local).
function fechaHoyLocal(){
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${dia}`;
}

// Estado EFECTIVO (lo que se muestra), combinando lo guardado + la fecha.
function obtenerEstadoVisual(funcion){

    const guardado =
        funcion?.estado || "pendiente";

    // Terminales: mandan siempre, sin importar la fecha.
    if(guardado === "cancelado"){ return ESTADOS_OPERACION.cancelado; }
    if(guardado === "finalizado"){ return ESTADOS_OPERACION.finalizado; }

    // No terminales: al llegar el día pasa a "En curso" automáticamente.
    const fecha = funcion?.fecha;

    if(fecha && fechaHoyLocal() >= fecha){
        return ESTADOS_OPERACION.en_curso;
    }

    // Antes del día: lo guardado (pendiente / confirmado / en_curso si lo forzó).
    return ESTADOS_OPERACION[guardado] || ESTADOS_OPERACION.pendiente;
}

// Selector de 5 estados (resalta el efectivo).
function crearSelectorEstadoRegistro(evento, funcion){

    const actual =
        obtenerEstadoVisual(funcion).valor;

    const pills =
        Object.values(ESTADOS_OPERACION).map(estado => `
            <button
                class="estado-pill ${estado.clase} ${estado.valor === actual ? "estado-activo" : ""}"
                onclick="cambiarEstadoRegistro(${evento.id}, ${funcion.id}, '${estado.valor}')"
                title="${estado.nombre}">
                ${estado.icono} ${estado.nombre}
            </button>
        `).join("");

    return `
        <div class="agenda-drawer-bloque">
            <h4>Estado de operación</h4>
            <div class="estado-selector">
                ${pills}
            </div>
        </div>
    `;
}

// Cambia el estado: guarda, registra timeline y refresca drawer + agenda.
async function cambiarEstadoRegistro(eventoId, funcionId, estado){

    try{

        const respuesta =
            await fetch(
                `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/estado`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estado })
                }
            );

        const resultado =
            await respuesta.json();

        if(!respuesta.ok){
            mostrarToast(resultado.mensaje || "No se pudo cambiar el estado", "error");
            return;
        }

        mostrarToast(resultado.mensaje || "Estado actualizado", "success");

        await refrescarDrawerChecklist(eventoId, funcionId);

    }catch(error){
        mostrarToast("Error de conexión al cambiar el estado", "error");
    }
}


/* ============================================================
   ALPHA v1.6: VISTA HOY

   Vista de solo lectura del día actual. Se pinta bajo demanda
   (mostrarSeccion -> renderVistaHoy) usando eventosActuales ya
   cargado; no toca cargarEventos ni el backend.
============================================================ */

// "YYYY-MM-DD HH:MM" en hora local (para comparar próxima operación).
function ahoraLocal(){
    const d = new Date();
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Fecha legible para el encabezado (ej. "Martes 30 de junio de 2026").
function formatearFechaLarga(fechaISO){
    try{
        const [a, m, d] = fechaISO.split("-").map(Number);
        const fecha = new Date(a, m - 1, d);
        const txt = fecha.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
        return txt.charAt(0).toUpperCase() + txt.slice(1);
    }catch(error){
        return fechaISO;
    }
}

function tipoVisualHoy(funcion){
    return (typeof obtenerTipoRegistroVisual === "function")
        ? obtenerTipoRegistroVisual(funcion)
        : { icono: "🎭", nombre: "Función" };
}

// Render principal de la Vista Hoy.
function renderVistaHoy(){

    if(typeof eventosActuales === "undefined" || !Array.isArray(eventosActuales)){
        return;
    }

    const hoy = fechaHoyLocal();

    // Todas las operaciones (evento + función).
    const todas = [];

    eventosActuales.forEach(evento => {
        (evento.funciones || []).forEach(funcion => {
            todas.push({ evento, funcion });
        });
    });

    const deHoy =
        todas.filter(operacion => operacion.funcion.fecha === hoy);

    const elFecha = document.getElementById("hoyFecha");
    if(elFecha){ elFecha.textContent = formatearFechaLarga(hoy); }

    renderHoyResumen(deHoy);
    renderHoyProxima(todas);
    renderHoyOperaciones(deHoy);
    renderHoyPendientes(deHoy);
}

// Resumen por estado (de las operaciones de hoy).
function renderHoyResumen(lista){

    const el = document.getElementById("hoyResumen");
    if(!el){ return; }

    const conteo = {
        pendiente: 0,
        confirmado: 0,
        en_curso: 0,
        finalizado: 0,
        cancelado: 0
    };

    lista.forEach(operacion => {
        const estado = obtenerEstadoVisual(operacion.funcion).valor;
        if(conteo[estado] !== undefined){ conteo[estado]++; }
    });

    el.innerHTML =
        Object.values(ESTADOS_OPERACION).map(estado => `
            <div class="hoy-resumen-item ${estado.clase}">
                <span class="hoy-resumen-icono">${estado.icono}</span>
                <span class="hoy-resumen-num">${conteo[estado.valor] || 0}</span>
                <span class="hoy-resumen-label">${estado.nombre}</span>
            </div>
        `).join("");
}

// Próxima operación (hoy o futuro, la más cercana que no ha pasado).
function renderHoyProxima(todas){

    const el = document.getElementById("hoyProxima");
    if(!el){ return; }

    const ahora = ahoraLocal();

    const futuras = todas
        .filter(operacion => operacion.funcion.fecha)
        .map(operacion => ({
            evento: operacion.evento,
            funcion: operacion.funcion,
            dt: `${operacion.funcion.fecha} ${operacion.funcion.hora || "00:00"}`
        }))
        .filter(operacion => operacion.dt >= ahora)
        .filter(operacion => {
            const estado = obtenerEstadoVisual(operacion.funcion).valor;
            return estado !== "cancelado" && estado !== "finalizado";
        })
        .sort((a, b) => a.dt.localeCompare(b.dt));

    if(futuras.length === 0){
        el.innerHTML = `<p class="hoy-vacio">No hay próximas operaciones.</p>`;
        return;
    }

    const prox = futuras[0];
    const tipoVisual = tipoVisualHoy(prox.funcion);
    const estado = obtenerEstadoVisual(prox.funcion);
    const hoy = fechaHoyLocal();

    const fechaTexto =
        prox.funcion.fecha === hoy
            ? "Hoy"
            : formatearFechaLarga(prox.funcion.fecha);

    el.innerHTML = `
        <div class="hoy-proxima-card">
            <div class="hoy-proxima-hora">⏰ ${escaparTexto(prox.funcion.hora || "--:--")}</div>
            <div class="hoy-proxima-info">
                <h4>${tipoVisual.icono} ${escaparTexto(prox.evento.nombre)}</h4>
                <p>📍 ${escaparTexto(prox.evento.lugar || "")}</p>
                <p class="hoy-proxima-fecha">📅 ${escaparTexto(fechaTexto)}</p>
                <span class="estado-badge ${estado.clase}">${estado.icono} ${estado.nombre}</span>
            </div>
        </div>
    `;
}

// Operaciones de hoy, ordenadas por hora.
function renderHoyOperaciones(lista){

    const el = document.getElementById("hoyOperaciones");
    if(!el){ return; }

    if(lista.length === 0){
        el.innerHTML = `<p class="hoy-vacio">No hay operaciones para hoy.</p>`;
        return;
    }

    const ordenadas =
        [...lista].sort((a, b) =>
            String(a.funcion.hora).localeCompare(String(b.funcion.hora))
        );

    el.innerHTML = ordenadas.map(operacion => {
        const tipoVisual = tipoVisualHoy(operacion.funcion);
        const estado = obtenerEstadoVisual(operacion.funcion);
        return `
            <div class="hoy-op-fila">
                <span class="hoy-op-hora">⏰ ${escaparTexto(operacion.funcion.hora || "--:--")}</span>
                <span class="hoy-op-nombre">${tipoVisual.icono} ${escaparTexto(operacion.evento.nombre)}</span>
                <span class="hoy-op-lugar">📍 ${escaparTexto(operacion.evento.lugar || "")}</span>
                <span class="estado-badge ${estado.clase}">${estado.icono} ${estado.nombre}</span>
            </div>
        `;
    }).join("");
}

// Pendientes (checklist no completado) de hoy, agrupados por operación.
function renderHoyPendientes(lista){

    const el = document.getElementById("hoyPendientes");
    if(!el){ return; }

    const conPendientes = lista
        .map(operacion => ({
            evento: operacion.evento,
            funcion: operacion.funcion,
            pendientes: (operacion.funcion.checklist || []).filter(item => !item.completado)
        }))
        .filter(operacion => operacion.pendientes.length > 0);

    if(conPendientes.length === 0){
        el.innerHTML = `<p class="hoy-vacio">Sin pendientes para hoy. 🎉</p>`;
        return;
    }

    el.innerHTML = conPendientes.map(operacion => {
        const tipoVisual = tipoVisualHoy(operacion.funcion);
        const items = operacion.pendientes
            .map(item => `<li>☐ ${escaparTexto(item.texto)}</li>`)
            .join("");
        return `
            <div class="hoy-pend-grupo">
                <h4>${tipoVisual.icono} ${escaparTexto(operacion.evento.nombre)}</h4>
                <ul class="hoy-pend-lista">${items}</ul>
            </div>
        `;
    }).join("");
}