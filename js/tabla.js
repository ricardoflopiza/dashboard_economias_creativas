console.log('Tabla dinámica cargada.');

document.getElementById('selectorTablaDin1').addEventListener('change', async () => {
    await updateDataAndTable();
});

document.getElementById('selectorTablaDin2').addEventListener('change', updateTable);

async function updateDataAndTable() {
    const selectedVariable = document.getElementById('selectorTablaDin1').value;
    updateAnalysisLevels(selectedVariable, 'selectorTablaDin2');

    const selectedFile = variableToFileMap[selectedVariable];

    if (selectedFile) {
        window.tableData = await loadDataFromCSV(selectedFile);
        updateTable();
    }
}

function updateTable() {
    const level = document.getElementById('selectorTablaDin2').value;
    const variable = document.getElementById('selectorTablaDin1').value;

    // Filtrar filas: eliminar aquellas con datos NA, vacíos o con categoría "Desconocido"
    const filteredData = window.tableData.filter(row => {
        const levelVal = row[level];
        const variableVal = row[variable];

        // Verificar el valor de la variable seleccionada
        if (!variableVal || variableVal.trim() === "" || variableVal === "Desconocido") {
            return false;
        }
        // Si no es nivel nacional, verificar también el nivel de análisis
        if (level !== "nacional") {
            if (!levelVal || levelVal.trim() === "" || levelVal === "NA" || levelVal === "N/A") {
                return false;
            }
        }
        return true;
    });

    let groupedData = {};

    // Agrupar los datos filtrados
    filteredData.forEach(row => {
        const levelKey = row[level] || "N/A";
        const variableKey = row[variable] || "Desconocido";

        // Si el nivel es "nacional", se agrupa solo por la variable
        const key = level === "nacional" ? variableKey : `${levelKey} - ${variableKey}`;

        if (!groupedData[key]) {
            groupedData[key] = { count: 0, level: levelKey, variable: variableKey };
        }
        groupedData[key].count += 1;
    });

    const tableBody = document.getElementById('tableBody');
    const tableHead = document.querySelector('#dynamicTable thead');

    // Limpiar contenido de la tabla
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    // Crear encabezado dinámico
    const headerRow = document.createElement('tr');

    // Si no es nivel nacional, agregar columna del nivel de análisis
    if (level !== "nacional") {
        const thLevel = document.createElement('th');
        thLevel.textContent = columnNameMap[level] || level;
        headerRow.appendChild(thLevel);
    }

    // Columna para la variable seleccionada
    const thGroup = document.createElement('th');
    thGroup.textContent = columnNameMap[variable] || variable;
    headerRow.appendChild(thGroup);

    // Columna para el conteo
    const thCount = document.createElement('th');
    thCount.textContent = "Cantidad";
    headerRow.appendChild(thCount);

    // Columna para el porcentaje
    const thPercentage = document.createElement('th');
    thPercentage.textContent = "Porcentaje";
    headerRow.appendChild(thPercentage);

    tableHead.appendChild(headerRow);

    // Calcular totales por nivel de análisis (tomando la variable del selectorTablaDin2)
    const levelTotals = Object.values(groupedData).reduce((acc, { level, count }) => {
        acc[level] = (acc[level] || 0) + count;
        return acc;
    }, {});

    // Ordenar las entradas agrupadas alfabéticamente por su key
    const sortedEntries = Object.entries(groupedData).sort((a, b) => {
        return a[0].localeCompare(b[0]);
    });

    sortedEntries.forEach(([key, { count, level: levelValue, variable: variableValue }]) => {
        const tr = document.createElement('tr');

        if (level !== "nacional") {
            const tdLevel = document.createElement('td');
            tdLevel.textContent = columnNameMap[levelValue] || levelValue;
            tr.appendChild(tdLevel);
        }

        const tdVariable = document.createElement('td');
        tdVariable.textContent = columnNameMap[variableValue] || variableValue;
        tr.appendChild(tdVariable);

        const tdCount = document.createElement('td');
        tdCount.textContent = count;
        tr.appendChild(tdCount);

        const tdPercentage = document.createElement('td');
        // El porcentaje se calcula en base al total del nivel de análisis seleccionado
        tdPercentage.textContent = ((count / levelTotals[levelValue]) * 100).toFixed(2) + '%';
        tr.appendChild(tdPercentage);

        tableBody.appendChild(tr);
    });
}

function downloadTable() {
    const table = document.getElementById('dynamicTable');
    const rows = Array.from(table.rows);

    // Crear un array de objetos para las filas
    const data = rows.map(row => {
        return Array.from(row.cells).map(cell => cell.textContent);
    });

    // Crear un libro de Excel
    const ws = XLSX.utils.aoa_to_sheet(data); // Convertir el array a una hoja
    const wb = XLSX.utils.book_new(); // Crear un nuevo libro
    XLSX.utils.book_append_sheet(wb, ws, 'Tabla Dinámica'); // Añadir la hoja al libro

    // Descargar el archivo como Excel
    XLSX.writeFile(wb, 'tabla_dinamica.xlsx');
}

document.getElementById('downloadButton').addEventListener('click', downloadTable);

// Cargar la tabla por defecto al inicio
updateDataAndTable();
