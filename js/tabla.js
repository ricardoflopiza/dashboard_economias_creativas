console.log('Tabla dinámica cargada.');

// selVarGenerales = null;
// selNivelGenerales = null;
// selVarTecno = null;
// selNivelTecno = null;

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

    let groupedData = {};

    window.tableData.forEach(row => {
        const levelKey = row[level] || "N/A";
        const variableKey = row[variable] || "Desconocido";

        const key = level === "nacional" ? variableKey : `${levelKey} - ${variableKey}`;

        if (!groupedData[key]) {
            groupedData[key] = { count: 0, level: levelKey, variable: variableKey };
        }
        groupedData[key].count += 1;
    });

    const tableBody = document.getElementById('tableBody');
    const tableHead = document.querySelector('#dynamicTable thead');

    // Limpiar la tabla
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    // Crear encabezado dinámico
    const headerRow = document.createElement('tr');

// Si no es nivel nacional, se agrega el nivel de análisis
if (level !== "nacional") {
    const thLevel = document.createElement('th');
    thLevel.textContent = columnNameMap[level] || level; // Usar el nombre mapeado
    headerRow.appendChild(thLevel);
}

// Columna de agrupación (variable seleccionada)
const thGroup = document.createElement('th');
thGroup.textContent = columnNameMap[variable] || variable; // Usar el nombre mapeado
headerRow.appendChild(thGroup);

// Columna de cantidad
const thCount = document.createElement('th');
thCount.textContent = "Cantidad";
headerRow.appendChild(thCount);

// Columna de porcentaje
const thPercentage = document.createElement('th');
thPercentage.textContent = "Porcentaje";
headerRow.appendChild(thPercentage);

tableHead.appendChild(headerRow);

    // Calcular totales por nivel
    const levelTotals = Object.values(groupedData).reduce((acc, { level, count }) => {
        acc[level] = (acc[level] || 0) + count;
        return acc;
    }, {});

    Object.entries(groupedData).forEach(([key, { count, level: levelValue, variable: variableValue }]) => {
        const tr = document.createElement('tr');
    
        if (level !== "nacional") {
            const tdLevel = document.createElement('td');
            tdLevel.textContent = columnNameMap[levelValue] || levelValue; // Mostrar nombre corregido
            tr.appendChild(tdLevel);
        }
    
        const tdVariable = document.createElement('td');
        tdVariable.textContent = columnNameMap[variableValue] || variableValue; // Mostrar nombre corregido
        tr.appendChild(tdVariable);
    
        const tdCount = document.createElement('td');
        tdCount.textContent = count;
        tr.appendChild(tdCount);
    
        const tdPercentage = document.createElement('td');
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

