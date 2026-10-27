document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formNotas");
    const mensajeDiv = document.getElementById("mensaje");
    const resultadoDiv = document.getElementById("resultado");
    
    const archivoInput = document.getElementById("archivo");
    const btnMostrar = document.getElementById("mostrarRegistros");
    const tablaDiv = document.getElementById("tablaRegistros");
    const estadisticasDiv = document.getElementById("estadisticas");

    // 1. Registro y Cálculo de Notas
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const nie = document.getElementById("nie").value.trim();
        const n1 = parseFloat(document.getElementById("nota1").value);
        const n2 = parseFloat(document.getElementById("nota2").value);
        const n3 = parseFloat(document.getElementById("nota3").value);
        const ex = parseFloat(document.getElementById("examen").value);

        if (!nombre || !nie || isNaN(n1) || isNaN(n2) || isNaN(n3) || isNaN(ex)) {
            mostrarMensaje("Por favor complete todos los campos correctamente.", "error");
            return;
        }

        // Cálculo: Notas continuas 60% (20% c/u) + Examen 40%
        const notaFinal = (n1 * 0.20) + (n2 * 0.20) + (n3 * 0.20) + (ex * 0.40);
        const estado = notaFinal >= 6.0 ? "APROBADO" : "REPROBADO";

        mostrarMensaje("Registro procesado con éxito.", "exito");
        
        resultadoDiv.innerHTML = `
            <p><strong>Estudiante:</strong> ${nombre} (NIE: ${nie})</p>
            <p><strong>Nota Final:</strong> ${notaFinal.toFixed(2)} - <strong>${estado}</strong></p>
        `;

        // Descargar los datos como archivo TXT
        const linea = `${nie},${nombre},${n1},${n2},${n3},${ex},${notaFinal.toFixed(2)},${estado}\n`;
        descargarArchivoTxt(`${nie}_${nombre.replace(/\s+/g, "_")}.txt`, linea);

        form.reset();
    });

    // 2. Consulta y Lectura de Archivos TXT
    btnMostrar.addEventListener("click", () => {
        const file = archivoInput.files[0];

        if (!file) {
            alert("Por favor seleccione un archivo .txt");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const contenido = e.target.result;
            procesarArchivoTxt(contenido);
        };
        reader.readAsText(file);
    });

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = tipo;
        mensajeDiv.style.display = "block";
    }

    function descargarArchivoTxt(nombreArchivo, contenido) {
        const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
        const enlace = document.createElement("a");
        enlace.href = URL.createObjectURL(blob);
        enlace.download = nombreArchivo;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
    }

    function procesarArchivoTxt(contenido) {
        const lineas = contenido.trim().split("\n");
        if (lineas.length === 0 || lineas[0] === "") {
            tablaDiv.innerHTML = "<p>El archivo está vacío.</p>";
            return;
        }

        let htmlTabla = `
            <table>
                <thead>
                    <tr>
                        <th>NIE</th>
                        <th>Nombre</th>
                        <th>N1</th>
                        <th>N2</th>
                        <th>N3</th>
                        <th>Examen</th>
                        <th>Final</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalNotas = 0;
        let totalEstudiantes = 0;
        let aprobados = 0;

        lineas.forEach((linea) => {
            const datos = linea.split(",");
            if (datos.length >= 8) {
                const [nie, nombre, n1, n2, n3, ex, final, estado] = datos;
                
                htmlTabla += `
                    <tr>
                        <td>${nie}</td>
                        <td>${nombre}</td>
                        <td>${n1}</td>
                        <td>${n2}</td>
                        <td>${n3}</td>
                        <td>${ex}</td>
                        <td><strong>${final}</strong></td>
                        <td>${estado}</td>
                    </tr>
                `;

                totalNotas += parseFloat(final);
                totalEstudiantes++;
                if (estado.trim() === "APROBADO") aprobados++;
            }
        });

        htmlTabla += "</tbody></table>";
        tablaDiv.innerHTML = htmlTabla;

        // Estadísticas acumuladas
        if (totalEstudiantes > 0) {
            const promedioGeneral = totalNotas / totalEstudiantes;
            estadisticasDiv.innerHTML = `
                <h3>Estadísticas del Grupo</h3>
                <p><strong>Total de estudiantes:</strong> ${totalEstudiantes}</p>
                <p><strong>Promedio general:</strong> ${promedioGeneral.toFixed(2)}</p>
                <p><strong>Aprobados:</strong> ${aprobados} | <strong>Reprobados:</strong> ${totalEstudiantes - aprobados}</p>
            `;
        }
    }
});