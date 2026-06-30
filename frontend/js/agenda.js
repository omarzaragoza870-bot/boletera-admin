/* ============================================================

   ALPHA v1: AGENDA PREMIUM

   RESPONSABILIDAD:
   - Construir calendario mensual.
   - Marcar días con funciones usando 🎭.
   - Abrir drawer de día.
   - Preparar base para activaciones y Siri/iPhone.

============================================================ */

let agendaFechaActual =
    new Date();

function actualizarAgenda(eventos){

    if(!document.getElementById("agendaCalendario")){
        return;
    }

    pintarAgendaCalendario(eventos);
    pintarAgendaResumen(eventos);
    pintarAgendaProximas(eventos);
}

function pintarAgendaCalendario(eventos){

    const contenedor =
        document.getElementById("agendaCalendario");

    const titulo =
        document.getElementById("agendaTituloMes");

    if(!contenedor || !titulo){
        return;
    }

    const year =
        agendaFechaActual.getFullYear();

    const month =
        agendaFechaActual.getMonth();

    titulo.textContent =
        agendaFechaActual.toLocaleDateString("es-MX", {
            month:"long",
            year:"numeric"
        });

    const primerDiaMes =
        new Date(year, month, 1);

    const ultimoDiaMes =
        new Date(year, month + 1, 0);

    const offset =
        (primerDiaMes.getDay() + 6) % 7;

    const totalDias =
        ultimoDiaMes.getDate();

    const funcionesPorFecha =
        agruparFuncionesPorFecha(eventos);

    contenedor.innerHTML = "";

    for(let i = 0; i < offset; i++){
        contenedor.innerHTML += `
            <div class="agenda-dia agenda-dia-vacio">
                <span class="agenda-dia-numero"></span>
            </div>
        `;
    }

    for(let dia = 1; dia <= totalDias; dia++){

        const fechaISO =
            construirFechaISO(year, month, dia);

        const funciones =
            funcionesPorFecha[fechaISO] || [];

        const hoy =
            esFechaHoy(year, month, dia);

        contenedor.innerHTML += crearDiaAgenda(
            dia,
            fechaISO,
            funciones,
            hoy
        );
    }
}

function crearDiaAgenda(
    dia,
    fechaISO,
    funciones,
    hoy
){

    const visibles =
        funciones.slice(0, 3);

    const restantes =
        funciones.length - visibles.length;

    const mascaras =
        visibles.map(item => {

            const boletos =
                calcularBoletosFuncion(item.funcion);

            const tipoVisual =
                typeof obtenerTipoRegistroVisual === "function"
                ? obtenerTipoRegistroVisual(item.funcion)
                : { icono: "🎭", clase: "tipo-funcion" };

            const esFuncionBoletaje =
                (item.funcion.tipoRegistro || "funcion") === "funcion";

            const claseEstado =
                item.funcion.activa === false
                ? "pausada"
                : esFuncionBoletaje && boletos <= 0
                    ? "sin-boletos"
                    : "";

            return `
                <span
                    class="agenda-mascara ${claseEstado} ${tipoVisual.clase}"
                    title="${escaparTexto(item.evento.nombre)}">
                    ${tipoVisual.icono}
                </span>
            `;
        }).join("");

    return `
        <div
            class="agenda-dia ${hoy ? "agenda-dia-hoy" : ""}"
            onclick="abrirAgendaDia('${fechaISO}')">

            <div>
                <span class="agenda-dia-numero">${dia}</span>

                <div class="agenda-mascaras">
                    ${mascaras}

                    ${
                        restantes > 0
                        ? `<span class="agenda-mas-eventos">+${restantes}</span>`
                        : ""
                    }
                </div>
            </div>

            <div class="agenda-dia-footer">
                ${
                    funciones.length > 0
                    ? `${funciones.length}`
                    : ""
                }
            </div>
        </div>
    `;
}

function abrirAgendaDia(fechaISO){

    const funciones =
        agruparFuncionesPorFecha(eventosActuales)[fechaISO] || [];

    if(funciones.length === 0){
        return;
    }

    const titulo =
        document.getElementById("agendaDrawerTitulo");

    const subtitulo =
        document.getElementById("agendaDrawerSubtitulo");

    const contenedor =
        document.getElementById("agendaDrawerFunciones");

    titulo.textContent =
        `🎭 ${formatearFechaAgenda(fechaISO)}`;

    subtitulo.textContent =
        `${funciones.length} función${funciones.length === 1 ? "" : "es"} programada${funciones.length === 1 ? "" : "s"}`;

    contenedor.innerHTML = "";

    funciones
        .sort((a, b) => String(a.funcion.hora).localeCompare(String(b.funcion.hora)))
        .forEach(item => {

            contenedor.innerHTML += crearFuncionAgendaCard(
                item.evento,
                item.funcion
            );
        });

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalAgendaDia")
        .classList
        .remove("oculto");
}

function cerrarAgendaDia(){

    document
        .getElementById("modalAgendaDia")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}

function crearFuncionAgendaCard(evento, funcion){

    const tipoVisual =
        typeof obtenerTipoRegistroVisual === "function"
        ? obtenerTipoRegistroVisual(funcion)
        : { icono: "🎭", nombre: "Función" };

    const tipoRegistro =
        funcion.tipoRegistro || "funcion";

    const esFuncion =
        tipoRegistro === "funcion";

    const estadoVisual =
        (typeof obtenerEstadoVisual === "function")
            ? obtenerEstadoVisual(funcion)
            : null;

    const estadoSelectorHTML =
        (typeof crearSelectorEstadoRegistro === "function")
            ? crearSelectorEstadoRegistro(evento, funcion)
            : "";

    let detalleHTML = "";

    if(esFuncion){
        const categorias = obtenerCategorias(funcion);

        detalleHTML += crearCategoriaAgendaMini(
            "🎫 General",
            categorias.general
        );

        if(categorias.preferente?.activa){
            detalleHTML += crearCategoriaAgendaMini(
                "🎟️ Preferente",
                categorias.preferente
            );
        }

        if(categorias.vip?.activa){
            detalleHTML += crearCategoriaAgendaMini(
                "⭐ VIP",
                categorias.vip
            );
        }
    }else{

        if(typeof crearDetalleOperativoAgenda === "function"){
            detalleHTML = crearDetalleOperativoAgenda(evento, funcion);
        }else{
            detalleHTML = `
                <div class="agenda-categoria-mini">
                    <span>${tipoVisual.icono} Tipo</span>
                    <strong>${escaparTexto(tipoVisual.nombre)}</strong>
                </div>

                ${
                    funcion.contacto
                    ? `<div class="agenda-categoria-mini"><span>👤 Contacto</span><strong>${escaparTexto(funcion.contacto)}</strong></div>`
                    : ""
                }

                ${
                    funcion.telefono
                    ? `<div class="agenda-categoria-mini"><span>📱 Teléfono</span><strong>${escaparTexto(funcion.telefono)}</strong></div>`
                    : ""
                }

                ${
                    funcion.notas
                    ? `<div class="agenda-categoria-mini"><span>📝 Notas</span><strong>${escaparTexto(funcion.notas)}</strong></div>`
                    : ""
                }
            `;
        }
    }

    return `
        <div class="agenda-funcion-card">
            <div class="agenda-funcion-top">
                <div>
                    <h3>${tipoVisual.icono} ${escaparTexto(evento.nombre)}</h3>
                    <p>📍 ${escaparTexto(evento.lugar)}</p>
                </div>

                <span class="agenda-hora">
                    ⏰ ${escaparTexto(funcion.hora)}
                </span>
            </div>

            <span class="${funcion.activa ? "status-ok" : "status-off"}">
                ${funcion.activa ? "🟢 Registro activo" : "🔴 Registro pausado"}
            </span>

            ${
                estadoVisual
                ? `<span class="estado-badge ${estadoVisual.clase}">${estadoVisual.icono} ${estadoVisual.nombre}</span>`
                : ""
            }

            ${estadoSelectorHTML}

            <div class="agenda-categorias-mini">
                ${detalleHTML}
            </div>

            <div class="agenda-funcion-actions">
                ${
                    esFuncion
                    ? `<button class="btn-secundario" onclick="cerrarAgendaDia(); abrirEditarFuncion(${evento.id}, ${funcion.id})">✏️ Editar</button>
                       <button class="btn-secundario btn-descuentos-funcion" onclick="cerrarAgendaDia(); abrirGestionDescuentos(${evento.id}, ${funcion.id})">🎁 Descuentos</button>`
                    : `<button class="btn-secundario" onclick="mostrarToast('La edición de activaciones entra en el siguiente paso.', 'success')">✏️ Editar</button>`
                }

                <button
                    class="btn-secundario"
                    onclick="toggleFuncion(${evento.id}, ${funcion.id})">
                    ${funcion.activa ? "⏸️ Pausar" : "▶️ Activar"}
                </button>

                <button
                    class="btn-danger"
                    onclick="eliminarFuncion(${evento.id}, ${funcion.id})">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `;
}

function crearCategoriaAgendaMini(nombre, categoria){

    return `
        <div class="agenda-categoria-mini">
            <span>${nombre}</span>
            <strong>${Number(categoria?.boletos || 0)} boletos</strong>
        </div>
    `;
}

function pintarAgendaResumen(eventos){

    const funcionesMes =
        obtenerFuncionesDelMes(eventos);

    const eventosUnicos =
        new Set(funcionesMes.map(item => item.evento.id));

    const boletos =
        funcionesMes.reduce((total, item) => {
            return total + calcularBoletosFuncion(item.funcion);
        }, 0);

    actualizarAgendaTexto("agendaTotalFunciones", funcionesMes.length);
    actualizarAgendaTexto("agendaTotalEventos", eventosUnicos.size);
    actualizarAgendaTexto("agendaTotalBoletos", boletos);
}

function pintarAgendaProximas(eventos){

    const contenedor =
        document.getElementById("agendaProximasFunciones");

    if(!contenedor){
        return;
    }

    const proximas =
        obtenerFuncionesOrdenadasAgenda(eventos)
            .filter(item => item.funcion.activa !== false)
            .slice(0, 4);

    if(proximas.length === 0){
        contenedor.innerHTML = `
            <div class="empty-state">
                No hay próximas funciones.
            </div>
        `;
        return;
    }

    contenedor.innerHTML = "";

    proximas.forEach(item => {

        contenedor.innerHTML += `
            <div class="agenda-proxima-item">
                <div>
                    <strong>${escaparTexto(item.evento.nombre)}</strong>
                    <span>${formatearFechaAgenda(item.funcion.fecha)} · ${escaparTexto(item.funcion.hora)}</span>
                </div>

                <span class="agenda-proxima-icono">
                    ${
                        typeof obtenerTipoRegistroVisual === "function"
                        ? obtenerTipoRegistroVisual(item.funcion).icono
                        : "🎭"
                    }
                </span>
            </div>
        `;
    });
}

function cambiarMesAgenda(direccion){

    agendaFechaActual =
        new Date(
            agendaFechaActual.getFullYear(),
            agendaFechaActual.getMonth() + direccion,
            1
        );

    actualizarAgenda(eventosActuales);
}

function irMesActualAgenda(){

    agendaFechaActual =
        new Date();

    actualizarAgenda(eventosActuales);
}

function agruparFuncionesPorFecha(eventos){

    const mapa = {};

    eventos.forEach(evento => {

        evento.funciones.forEach(funcion => {

            if(!mapa[funcion.fecha]){
                mapa[funcion.fecha] = [];
            }

            mapa[funcion.fecha].push({
                evento,
                funcion
            });
        });
    });

    return mapa;
}

function obtenerFuncionesDelMes(eventos){

    const year =
        agendaFechaActual.getFullYear();

    const month =
        agendaFechaActual.getMonth();

    return obtenerFuncionesOrdenadasAgenda(eventos)
        .filter(item => {

            const fecha =
                new Date(`${item.funcion.fecha}T00:00:00`);

            return (
                fecha.getFullYear() === year &&
                fecha.getMonth() === month
            );
        });
}

function obtenerFuncionesOrdenadasAgenda(eventos){

    const funciones = [];

    eventos.forEach(evento => {

        evento.funciones.forEach(funcion => {

            funciones.push({
                evento,
                funcion,
                fechaOrden:
                    new Date(`${funcion.fecha}T${funcion.hora || "00:00"}`)
            });
        });
    });

    return funciones.sort((a, b) => {
        return a.fechaOrden - b.fechaOrden;
    });
}

function construirFechaISO(year, month, day){

    const mes =
        String(month + 1).padStart(2, "0");

    const dia =
        String(day).padStart(2, "0");

    return `${year}-${mes}-${dia}`;
}

function esFechaHoy(year, month, day){

    const hoy =
        new Date();

    return (
        hoy.getFullYear() === year &&
        hoy.getMonth() === month &&
        hoy.getDate() === day
    );
}

function formatearFechaAgenda(fechaISO){

    if(!fechaISO){
        return "Sin fecha";
    }

    const fecha =
        new Date(`${fechaISO}T00:00:00`);

    return fecha.toLocaleDateString("es-MX", {
        day:"2-digit",
        month:"long",
        year:"numeric"
    });
}

function actualizarAgendaTexto(id, valor){

    const elemento =
        document.getElementById(id);

    if(elemento){
        elemento.textContent = valor;
    }
}