/* =============================
   MODULO DESCUENTOS
   ============================= */


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

                    ❌

                </button>
            </div>
        `;
    });
}


function eliminarDescuentoTemp(index){

    descuentosTemporales.splice(index, 1);

    pintarDescuentosTemp();
}


function crearHTMLDescuentos(
    descuentos,
    eventoId,
    funcionId
){

    if(!descuentos || descuentos.length === 0){
        return "";
    }

    let descuentosHTML = "";

    descuentos.forEach((descuento, index) => {

        descuentosHTML += `
            <div class="descuento-chip">
                🎁 ${escaparTexto(descuento.codigo)} - ${
                    descuento.tipo === "porcentaje"
                    ? `${Number(descuento.valor || 0)}%`
                    : `$${Number(descuento.valor || 0)}`
                }

                <button
                    type="button"
                    title="Eliminar descuento"
                    onclick="eliminarDescuentoGuardado(${eventoId}, ${funcionId}, ${index})">

                    🗑️

                </button>
            </div>
        `;
    });

    return `
        <div class="descuentos-funcion">
            <div class="descuentos-header">
    <h4>🎁 Descuentos</h4>

    <button
        type="button"
        class="btn-secundario btn-mini"
        onclick="abrirModalAgregarDescuento(${eventoId}, ${funcionId})">

        + Descuento

    </button>
</div>

            <div class="descuentos-lista">
                ${descuentosHTML}
            </div>
        </div>
    `;
}


async function eliminarDescuentoGuardado(
    eventoId,
    funcionId,
    index
){

    abrirConfirmacion(
        "Eliminar descuento",
        "¿Seguro que quieres eliminar este descuento?",
        async function(){

            const respuesta = await fetch(
                `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/descuentos/${index}`,
                {
                    method: "DELETE"
                }
            );

            const resultado =
                await respuesta.json();

            mostrarToast(resultado.mensaje, "success");

            cargarEventos();
        }
    );
}


function abrirModalAgregarDescuento(eventoId, funcionId){

    document.getElementById("descuentoEventoId").value =
        eventoId;

    document.getElementById("descuentoFuncionId").value =
        funcionId;

    document.getElementById("nuevoCodigoDescuento").value = "";
    document.getElementById("nuevoTipoDescuento").value = "porcentaje";
    document.getElementById("nuevoValorDescuento").value = "";

    document.body.classList.add("modal-abierto");

    document
        .getElementById("modalAgregarDescuento")
        .classList
        .remove("oculto");
}


function cerrarModalAgregarDescuento(){

    document
        .getElementById("modalAgregarDescuento")
        .classList
        .add("oculto");

    document.body.classList.remove("modal-abierto");
}


async function guardarDescuentoGuardado(boton){

    iniciarCarga(boton, "Guardando...");

    const eventoId =
        document.getElementById("descuentoEventoId").value;

    const funcionId =
        document.getElementById("descuentoFuncionId").value;

    const descuento = {
        codigo:
            document.getElementById("nuevoCodigoDescuento").value.trim(),

        tipo:
            document.getElementById("nuevoTipoDescuento").value,

        valor:
            Number(document.getElementById("nuevoValorDescuento").value)
    };

    if(!descuento.codigo || !descuento.valor){
        mostrarToast("Completa código y valor", "warning");
        terminarCarga(boton);
        return;
    }

    const respuesta = await fetch(
        `${API_URL}/api/eventos/${eventoId}/funciones/${funcionId}/descuentos`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(descuento)
        }
    );

    const resultado =
        await respuesta.json();

    mostrarToast(resultado.mensaje, "success");

    cerrarModalAgregarDescuento();

    cargarEventos();

    terminarCarga(boton);
}
