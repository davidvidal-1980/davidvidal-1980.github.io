"use strict";

// ======================================
// 1. PRODUCTOS Y PRECIOS
// ======================================

const productos = {
    P001: { nombre: "Sandwich de pollo", precio: 1.75 },
    P002: { nombre: "Hot dog", precio: 1.25 },
    P003: { nombre: "Empanada", precio: 0.75 },
    P004: { nombre: "Enchilada", precio: 1.00 },
    P005: { nombre: "Pastel de chocolate", precio: 1.50 },
    P006: { nombre: "Licuado de fresa", precio: 1.25 },
    P007: { nombre: "Café con leche", precio: 1.00 },
    P008: { nombre: "Galletas", precio: 0.50 }
};

const CLAVE_STORAGE = "cafeteria_pedidos_v1";

const formulario = document.getElementById("formPedido");
const clienteInput = document.getElementById("cliente");
const productoSelect = document.getElementById("producto");
const cantidadInput = document.getElementById("cantidad");

const precioTexto = document.getElementById("precio");
const subtotalTexto = document.getElementById("subtotal");
const descuentoTexto = document.getElementById("descuento");
const totalTexto = document.getElementById("total");

const listaPedidos = document.getElementById("listaPedidos");
const resultado = document.getElementById("resultado");
const detallePedido = document.getElementById("detallePedido");

const botonNuevo = document.getElementById("nuevoPedido");
const botonExportar = document.getElementById("exportar");
const botonAbrir = document.getElementById("abrirArchivo");
const archivoTXT = document.getElementById("archivoTXT");

let pedidos = cargarPedidosGuardados();

// ======================================
// 2. FUNCIONES PARA LOS PRECIOS
// ======================================

function dinero(cantidad) {
    return "$" + Number(cantidad).toFixed(2);
}

function obtenerCalculo() {
    const codigoProducto = productoSelect.value;
    const cantidad = Number(cantidadInput.value);
    const producto = productos[codigoProducto];

    if (
        !producto ||
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 999
    ) {
        return null;
    }

    const subtotal = Number(
        (producto.precio * cantidad).toFixed(2)
    );

    // Se aplica el 10% de descuento desde 5 unidades.
    const descuento = cantidad >= 5
        ? Number((subtotal * 0.10).toFixed(2))
        : 0;

    const total = Number(
        (subtotal - descuento).toFixed(2)
    );

    return {
        producto,
        cantidad,
        subtotal,
        descuento,
        total
    };
}

// Actualiza los importes cuando cambia el formulario.
function actualizarCalculo() {
    const codigo = productoSelect.value;
    const producto = productos[codigo];
    const calculo = obtenerCalculo();

    precioTexto.textContent = producto
        ? dinero(producto.precio)
        : dinero(0);

    if (!calculo) {
        subtotalTexto.textContent = dinero(0);
        descuentoTexto.textContent = dinero(0);
        totalTexto.textContent = dinero(0);
        return;
    }

    subtotalTexto.textContent = dinero(calculo.subtotal);
    descuentoTexto.textContent = dinero(calculo.descuento);
    totalTexto.textContent = dinero(calculo.total);
}

productoSelect.addEventListener("change", actualizarCalculo);
cantidadInput.addEventListener("input", actualizarCalculo);

// ======================================
// 3. GUARDAR EN EL NAVEGADOR
// ======================================

function guardarPedidos() {
    try {
        localStorage.setItem(
            CLAVE_STORAGE,
            JSON.stringify(pedidos)
        );
    } catch (error) {
        alert(
            "No se pudieron guardar los pedidos en el navegador. " +
            "Descarga el archivo TXT para conservarlos."
        );
    }
}

function cargarPedidosGuardados() {
    try {
        const datos = localStorage.getItem(CLAVE_STORAGE);

        if (!datos) {
            return [];
        }

        const registros = JSON.parse(datos);

        if (!Array.isArray(registros)) {
            return [];
        }

        return registros.filter(esPedidoValido);
    } catch (error) {
        return [];
    }
}

// ======================================
// 4. VALIDAR Y PREPARAR REGISTROS
// ======================================

function esPedidoValido(pedido) {
    if (!pedido || typeof pedido !== "object") {
        return false;
    }

    const producto = productos[pedido.codigoProducto];
    const cantidad = Number(pedido.cantidad);

    if (
        typeof pedido.codigo !== "string" ||
        !/^\d{3,}$/.test(pedido.codigo) ||
        typeof pedido.cliente !== "string" ||
        pedido.cliente.trim().length < 1 ||
        pedido.cliente.length > 80 ||
        !producto ||
        !Number.isInteger(cantidad) ||
        cantidad < 1 ||
        cantidad > 999 ||
        !["Efectivo", "Tarjeta"].includes(pedido.pago)
    ) {
        return false;
    }

    const subtotal = Number(
        (producto.precio * cantidad).toFixed(2)
    );

    const descuento = cantidad >= 5
        ? Number((subtotal * 0.10).toFixed(2))
        : 0;

    const total = Number(
        (subtotal - descuento).toFixed(2)
    );

    return (
        Number(pedido.precio) === producto.precio &&
        Number(pedido.subtotal) === subtotal &&
        Number(pedido.descuento) === descuento &&
        Number(pedido.total) === total
    );
}

function siguienteCodigo() {
    let mayor = 0;

    for (const pedido of pedidos) {
        const numero = Number(pedido.codigo);

        if (Number.isSafeInteger(numero) && numero > mayor) {
            mayor = numero;
        }
    }

    if (mayor >= Number.MAX_SAFE_INTEGER) {
        throw new Error("Se alcanzó el límite de códigos.");
    }

    return String(mayor + 1).padStart(3, "0");
}

// ======================================
// 5. REGISTRAR UN PEDIDO
// ======================================

formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const cliente = clienteInput.value.trim();
    const calculo = obtenerCalculo();
    const pago = document.querySelector(
        'input[name="pago"]:checked'
    )?.value;

    if (!cliente || cliente.length > 80) {
        alert("Escribe un nombre de cliente válido.");
        clienteInput.focus();
        return;
    }

    if (!calculo) {
        alert("Selecciona un producto y una cantidad válida.");
        return;
    }

    if (!["Efectivo", "Tarjeta"].includes(pago)) {
        alert("Selecciona un método de pago.");
        return;
    }

    // Evita el separador que utiliza el formato TXT.
    if (cliente.includes("|")) {
        alert("El nombre no puede contener el símbolo |.");
        return;
    }

    try {
        const pedido = {
            codigo: siguienteCodigo(),
            cliente: cliente,
            codigoProducto: productoSelect.value,
            producto: calculo.producto.nombre,
            cantidad: calculo.cantidad,
            precio: calculo.producto.precio,
            subtotal: calculo.subtotal,
            descuento: calculo.descuento,
            total: calculo.total,
            pago: pago
        };

        pedidos.push(pedido);

        guardarPedidos();
        mostrarPedidos();
        mostrarDetalle(pedido);
        formulario.reset();
        actualizarCalculo();

        resultado.hidden = false;
        resultado.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        alert(error.message || "No se pudo registrar el pedido.");
    }
});

// ======================================
// 6. MOSTRAR EL PEDIDO REGISTRADO
// ======================================

function mostrarDetalle(pedido) {
    detallePedido.replaceChildren();

    const datos = [
        ["Código", pedido.codigo],
        ["Cliente", pedido.cliente],
        ["Producto", pedido.producto],
        ["Cantidad", pedido.cantidad],
        ["Precio unitario", dinero(pedido.precio)],
        ["Subtotal", dinero(pedido.subtotal)],
        ["Descuento", dinero(pedido.descuento)],
        ["Pago", pedido.pago]
    ];

    for (const [etiqueta, valor] of datos) {
        const linea = document.createElement("p");
        const nombre = document.createElement("strong");

        nombre.textContent = etiqueta + ": ";
        linea.append(nombre, document.createTextNode(String(valor)));
        detallePedido.appendChild(linea);
    }

    const total = document.createElement("p");
    total.className = "total-final";
    total.textContent = "TOTAL: " + dinero(pedido.total);

    detallePedido.appendChild(total);
}

botonNuevo.addEventListener("click", function () {
    resultado.hidden = true;
    clienteInput.focus();
});

// ======================================
// 7. MOSTRAR TODOS LOS PEDIDOS
// ======================================

function mostrarPedidos() {
    listaPedidos.replaceChildren();

    if (pedidos.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 6;
        celda.className = "vacio";
        celda.textContent = "No hay pedidos registrados todavía.";

        fila.appendChild(celda);
        listaPedidos.appendChild(fila);
    } else {
        for (const pedido of pedidos) {
            const fila = document.createElement("tr");

            const valores = [
                pedido.codigo,
                pedido.cliente,
                pedido.producto,
                pedido.cantidad,
                dinero(pedido.total),
                pedido.pago
            ];

            for (const valor of valores) {
                const celda = document.createElement("td");
                celda.textContent = String(valor);
                fila.appendChild(celda);
            }

            listaPedidos.appendChild(fila);
        }
    }

    actualizarResumen();
}

// ======================================
// 8. RESUMEN DE VENTAS
// ======================================

function actualizarResumen() {
    const ventasEnCentavos = pedidos.reduce(
        (acumulado, pedido) =>
            acumulado + Math.round(Number(pedido.total) * 100),
        0
    );

    document.getElementById("totalVentas").textContent =
        dinero(ventasEnCentavos / 100);

    document.getElementById("numeroPedidos").textContent =
        pedidos.length +
        (pedidos.length === 1
            ? " pedido registrado"
            : " pedidos registrados");
}

// ======================================
// 9. CREAR EL CONTENIDO DEL TXT
// ======================================

// Formato:
// Código|Cliente|Producto|Cantidad|Precio|Subtotal|
// Descuento|Total|Método de pago

function generarTXT() {
    return pedidos.map(function (pedido) {
        return [
            pedido.codigo,
            pedido.cliente,
            pedido.producto,
            pedido.cantidad,
            Number(pedido.precio).toFixed(2),
            Number(pedido.subtotal).toFixed(2),
            Number(pedido.descuento).toFixed(2),
            Number(pedido.total).toFixed(2),
            pedido.pago
        ].join("|");
    }).join("\r\n");
}

// ======================================
// 10. DESCARGAR PEDIDOS.TXT
// ======================================

botonExportar.addEventListener("click", function () {
    if (pedidos.length === 0) {
        alert("Todavía no hay pedidos para exportar.");
        return;
    }

    const contenido = generarTXT();

    const archivo = new Blob(
        ["\uFEFF" + contenido],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "pedidos.txt";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
});

// ======================================
// 11. SELECCIONAR EL ARCHIVO TXT
// ======================================

botonAbrir.addEventListener("click", function () {
    archivoTXT.click();
});

// ======================================
// 12. LEER Y CARGAR PEDIDOS.TXT
// ======================================

archivoTXT.addEventListener("change", async function () {
    const archivo = archivoTXT.files[0];

    if (!archivo) {
        return;
    }

    try {
        const contenido = await archivo.text();

        const lineas = contenido
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(linea => linea.trim() !== "");

        const importados = [];
        const codigosVistos = new Set();

        for (const linea of lineas) {
            const campos = linea.split("|");

            if (campos.length !== 9) {
                throw new Error(
                    "El archivo contiene una fila con formato incorrecto."
                );
            }

            const [
                codigo,
                cliente,
                nombreProducto,
                cantidadTexto,
                precioTextoTXT,
                subtotalTextoTXT,
                descuentoTextoTXT,
                totalTextoTXT,
                pago
            ] = campos;

            const entradaProducto = Object.entries(productos).find(
                ([, producto]) => producto.nombre === nombreProducto
            );

            if (!entradaProducto) {
                throw new Error(
                    "Se encontró un producto que no existe: " +
                    nombreProducto
                );
            }

            const [codigoProducto, producto] = entradaProducto;
            const cantidad = Number(cantidadTexto);

            if (
                !/^\d{3,}$/.test(codigo) ||
                codigosVistos.has(codigo)
            ) {
                throw new Error(
                    "Hay códigos inválidos o repetidos en el archivo."
                );
            }

            codigosVistos.add(codigo);

            const subtotal = Number(
                (producto.precio * cantidad).toFixed(2)
            );

            const descuento = cantidad >= 5
                ? Number((subtotal * 0.10).toFixed(2))
                : 0;

            const total = Number(
                (subtotal - descuento).toFixed(2)
            );

            const pedido = {
                codigo,
                cliente,
                codigoProducto,
                producto: nombreProducto,
                cantidad,
                precio: Number(precioTextoTXT),
                subtotal: Number(subtotalTextoTXT),
                descuento: Number(descuentoTextoTXT),
                total: Number(totalTextoTXT),
                pago
            };

            if (!esPedidoValido(pedido)) {
                throw new Error(
                    "Un registro contiene datos inválidos: " + codigo
                );
            }

            importados.push(pedido);
        }

        // Reemplaza los registros anteriores por los del archivo.
        // No duplica pedidos al cargar el mismo TXT nuevamente.
        pedidos = importados;

        guardarPedidos();
        mostrarPedidos();

        resultado.hidden = true;
        alert(
            "Archivo cargado correctamente.\n" +
            "Pedidos importados: " + pedidos.length
        );

    } catch (error) {
        alert("No se pudo cargar el archivo:\n" + error.message);
    } finally {
        // Permite seleccionar el mismo archivo otra vez.
        archivoTXT.value = "";
    }
});

// ======================================
// 13. INICIAR EL SISTEMA
// ======================================

actualizarCalculo();
mostrarPedidos();