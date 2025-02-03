
function loadTabContent(tabFile, jsFile) {
    const tabContent = document.getElementById('tabContent');
    tabContent.innerHTML = '<p>Cargando contenido...</p>'; // Mensaje temporal

    fetch(tabFile)
        .then((response) => {
            if (!response.ok) throw new Error('Error al cargar el contenido.');
            return response.text();
        })
        .then((content) => {
            tabContent.innerHTML = content; // Insertar contenido dinámico
            console.log(`Contenido de ${tabFile} cargado.`);

            // Cargar script específico para la pestaña
            const script = document.createElement('script');
            script.src = `js/${jsFile}`;
            document.body.appendChild(script);
        })
        .catch((error) => {
            tabContent.innerHTML = '<p style="color: red;">No se pudo cargar el contenido. Intente nuevamente.</p>';
            console.error(error);
        });
}


  // Cargar el Dashboard por defecto al cargar la página
  window.onload = () => {
    loadTabContent('dashboard.html','dashboard.js'); // Cargar automáticamente el contenido del Dashboard
  };



// function calculateGroupedData(level, variable) {
//     if (!window.tableData) {
//         console.error('No hay datos en window.tableData.');
//         return {};
//     }

//     let groupedData;

//     if (level === "nacional") {
//         groupedData = window.tableData.reduce((acc, row) => {
//             const key = row[variable];
//             if (!key) return acc;
//             if (!acc[key]) {
//                 acc[key] = { count: 0 };
//             }
//             acc[key].count += 1;
//             return acc;
//         }, {});
//     } else {
//         groupedData = window.tableData.reduce((acc, row) => {
//             const levelKey = row[level];
//             const variableKey = row[variable];
//             if (!variableKey || !levelKey) return acc;

//             const key = `${levelKey} - ${variableKey}`;
//             if (!acc[key]) {
//                 acc[key] = { count: 0, level: levelKey };
//             }
//             acc[key].count += 1;
//             return acc;
//         }, {});

//         // Calcular totales por nivel
//         const levelTotals = Object.values(groupedData).reduce((acc, { level, count }) => {
//             acc[level] = (acc[level] || 0) + count;
//             return acc;
//         }, {});

//         // Añadir los totales al groupedData
//         Object.entries(groupedData).forEach(([key, data]) => {
//             groupedData[key].totalForLevel = levelTotals[data.level];
//         });
//     }

//     return groupedData;
// }



// // Objeto global para almacenar los datos cargados dinámicamente
// window.tableData = [];

// // Función para cargar datos de un archivo CSV dinámicamente
// async function loadDynamicTable(selectedFile) {
//     try {
//         const response = await fetch(`../assets/${selectedFile}`);
//         const data = await response.text();

//         const rows = data.split('\n').filter(row => row.trim() !== '');
//         const headers = rows[0].split(',');

//         // Guardar los datos procesados para usar en la tabla
//         window.tableData = rows.slice(1).map(row => {
//             const values = row.split(',');
//             return headers.reduce((acc, header, index) => {
//                 acc[header] = values[index];
//                 return acc;
//             }, {});
//         });

//     } catch (error) {
//         console.error('Error al cargar el archivo:', error);
//     }
// }


// // Función para agrupar datos por variable y nivel
// function groupData(data, variable, level) {
//     return data.reduce((acc, row) => {
//         const levelKey = row[level];
//         const variableKey = row[variable];
//         if (!levelKey || !variableKey) return acc;

//         const key = `${levelKey} - ${variableKey}`;
//         if (!acc[key]) acc[key] = { count: 0, level: levelKey };
//         acc[key].count += 1;
//         return acc;
//     }, {});
// }

// // Función para actualizar dinámicamente las opciones de "Nivel de análisis"
// function updateAnalysisLevels(variable) {
//     const levelSelector = document.getElementById('selectorTecnoAnalisis');
//     levelSelector.innerHTML = ''; // Limpiar las opciones actuales

//     // Opciones generales
//     const options = [
//         { value: 'nacional', text: 'Nacional' },
//         { value: 'region', text: 'Región' },
//         { value: 'cadena_productiva', text: 'Cadena Productiva' },
//         { value: 'tipo_empresa', text: 'Tipo de Empresa' }
//     ];

//     // Añadir "nivel_adopcion" si la variable seleccionada es "tecnologias"
//     if (variable === 'tecnologias') {
//         options.push({ value: 'nivel_adopcion', text: 'Nivel de Adopción' });
//     }

//     // Crear las nuevas opciones en el selector
//     options.forEach(option => {
//         const optionElement = document.createElement('option');
//         optionElement.value = option.value;
//         optionElement.textContent = option.text;
//         levelSelector.appendChild(optionElement);
//     });
// }
