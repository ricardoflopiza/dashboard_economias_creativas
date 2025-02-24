



// acá se cargan las variables y funciones en dashboard.js y tabla.js



// function loadTabContent(tabFile, jsFile) {
//   const tabContent = document.getElementById('tabContent');
//   tabContent.innerHTML = '<p>Cargando contenido...</p>'; // Mensaje temporal

//   fetch(tabFile)
//       .then((response) => {
//           if (!response.ok) throw new Error('Error al cargar el contenido.');
//           return response.text();
//       })
//       .then((content) => {
//           tabContent.innerHTML = content; // Insertar contenido dinámico
//           console.log(`Contenido de ${tabFile} cargado.`);

//           // Cargar script específico para la pestaña
//           const script = document.createElement('script');
//           script.src = `js/${jsFile}`;
//           document.body.appendChild(script);
//       })
//       .catch((error) => {
//           tabContent.innerHTML = '<p style="color: red;">No se pudo cargar el contenido. Intente nuevamente.</p>';
//           console.error(error);
//       });

//         // 2. Cerrar menú si estamos en móvil
//   if (window.innerWidth < 768) {
//     document.getElementById('navMenu').classList.remove('show');
//   }
// }

// // Cargar el Dashboard por defecto al cargar la página
// window.onload = () => {
//   loadTabContent('dashboard.html','dashboard.js'); // Cargar automáticamente el contenido del Dashboard
// };


let mapChart;
let originalMapOption;
let currentRegion = 'nacional';



let isMobile = window.innerWidth <= 768;

function changeTab(element, tabFile, jsFile) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = '<p>Cargando contenido...</p>';

  // Remover 'active' de todas las pestañas
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  element.classList.add('active');

  fetch(tabFile)
    .then(response => {
      if (!response.ok) throw new Error('Error al cargar el contenido.');
      return response.text();
    })
    .then(content => {
      tabContent.innerHTML = content;
      console.log(`Contenido de ${tabFile} cargado.`);

      const existingScript = document.querySelector(`script[src^="js/${jsFile}"]`);
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = `js/${jsFile}?t=${new Date().getTime()}`;
      script.onload = () => {
        // Si es dashboard, reinicializa el mapa
        if (tabFile.includes('dashboard.html')) {
          setTimeout(() => {
            console.log("Inicializando mapa en dashboard");
            initMap();
            // También forzamos un resize para otros gráficos
            window.dispatchEvent(new Event('resize'));
          }, 200);
        }
      };
      document.body.appendChild(script);
    })
    .catch(error => {
      tabContent.innerHTML = '<p style="color: red;">No se pudo cargar el contenido. Intente nuevamente.</p>';
      console.error(error);
    });

  if (window.innerWidth < 768) {
    document.getElementById('navMenu').classList.remove('show');
  }
}





// // Agregar el eventListener para el botón de menú en móviles
// document.getElementById('navToggle').addEventListener('click', function () {
//   document.getElementById('navMenu').classList.toggle('show');
// });

      // **Cargar la pestaña por defecto al inicio**
      document.addEventListener("DOMContentLoaded", function () {
        const defaultTab = document.querySelector('.tab'); // Primer tab
        if (defaultTab) {
          changeTab(defaultTab, 'dashboard.html', 'dashboard.js');
        }
      });

/************************************************************
  1. Mapeo de variable -> archivo CSV
*************************************************************/
const variableToFileMap = {
  // Características Generales
  "tipo_empresa": "df_select.csv",
  "cadena_productiva": "df_select.csv",
  "asociatividad": "df_select.csv",
  "genero": "df_select.csv",
  "tamano_empresa_num_trab": "df_select.csv",
  "rango_ventas": "df_select.csv",
  "exportaciones": "df_select.csv",
  "exportaciones_porc_ingreso": "df_select.csv",
  "financiamiento": "d_fuentes_financiamiento.csv",
  "internacionalizacion": "df_select.csv",
  
  // Características Tecnocreativas
  "agrupacion_tecnocreativa": "df_select.csv",
  "tecnologias": "d_tecnologias.csv",
  "herramientas_diferenciacion": "d_diferenciacion.csv",
  "interaccion": "d_interaccion_sect_no_creativos.csv",
  "tendencias": "d_tendencias_tecno.csv",
  "brechas": "d_brechas.csv"
};

/// Tabla para tabla dinámica
const columnNameMap = {
  "cadena_productiva": "Cadena Productiva",
  "genero": "Género",
  "tamano_empresa_num_trab": "Tamaño de Empresa",
  "rango_ventas": "Rango de Ventas",
  "exportaciones": "Exportaciones",
  "exportaciones_porc_ingreso": "Porcentaje de Exportaciones",
  "financiamiento": "Fuentes de Financiamiento",
  "internacionalizacion": "Internacionalización",
  "agrupacion_tecnocreativa": "Agrupación Tecnocreativa",
  "tecnologias": "Uso de Tecnología",
  "herramientas_diferenciacion": "Herramientas de Diferenciación",
  "interaccion": "Interacción con Otros Sectores",
  "tendencias": "Tendencias Tecnocreativas",
  "brechas": "Brechas y Drivers",
  "tipo_empresa": "Tipo de Empresa",
  "region": "Región"
};


// Opcional: Para no volver a cargar el mismo archivo muchas veces, podemos
// almacenar los datos en caché según el archivo.
const dataCache = {};

/************************************************************
  2. Función para cargar datos desde CSV
     (utiliza caché si ya se han cargado antes)
*************************************************************/
async function loadDataFromCSV(fileName) {
  // Si ya está en caché, devuélvelo directamente
  if (dataCache[fileName]) {
    return dataCache[fileName];
  }
  try {
    const response = await fetch(`assets/${fileName}`);
    const csvText = await response.text();
    
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(';');

    const parsedData = rows.slice(1).map(row => {
      const values = row.split(';');
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || "";
      });
      return obj;
    });

    // Guardar en caché
    dataCache[fileName] = parsedData;
    return parsedData;
  } catch (error) {
    console.error("Error al cargar el archivo CSV:", error);
    return [];
  }
}


// Función para actualizar dinámicamente las opciones de "Nivel de análisis" al utilizar la variable de interes "tecnología"
// Especificamente tecnología tiene una subvariable que es "Nivel de adopción"
function updateAnalysisLevels(variable, toupdate) {
  // Solo actualiza el selector si es selector1b y la variable es "tecnologias"
  if (toupdate === "selector1b" && variable !== "tecnologias") {
    return;
  }

  const levelSelector = document.getElementById(toupdate);
  levelSelector.innerHTML = ''; // Limpiar las opciones actuales

  // Opciones generales
  const options = [
    { value: 'nacional', text: 'Nacional' },
    { value: 'region', text: 'Región' },
    { value: 'cadena_productiva', text: 'Cadena Productiva' },
    { value: 'tipo_empresa', text: 'Tipo de Empresa' }
  ];

  // Si la variable es "tecnologias", añadir opción extra
  if (variable === 'tecnologias') {
    options.push({ value: 'nivel_adopcion', text: 'Nivel de Adopción (Solo para tecnología)' });
  }

  // Crear y añadir las opciones
  options.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.text;
    levelSelector.appendChild(optionElement);
  });
}



let chartInstances = {}; // Podremos guardar instancias ECharts por contenedor

let selVarGenerales = document.getElementById("selectorGeneralesInteres");
let selNivelGenerales = document.getElementById("selectorTecnoAnalisis");
let selVarTecno = document.getElementById("selector2b");
let selNivelTecno = document.getElementById("selector1b");



// Función de debounce para eventos de resize
function debounce(func, wait = 100) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function handleResize() {
  try {
    // Redimensionar gráficos de dashboard
    Object.values(chartInstances).forEach(chartInstance => {
      if (chartInstance && typeof chartInstance.resize === 'function') {
        chartInstance.resize();
      }
    });

    updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
    updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
    renderCharts(currentRegion || 'nacional');

    // Redimensionar el mapa si está inicializado
    if (mapChart && typeof mapChart.resize === 'function') {
      mapChart.setOption(originalMapOption, true); // Restablecer opción original
      mapChart.resize();
    }
  } catch (error) {
    console.error('Error durante el resize:', error);
  }
}


const debouncedResize = debounce(handleResize);


// Mapa 

let mapdata = [];






// d3.csv("assets/mapa_metadata.csv").then(function(data) {
//     // Transformar los datos al formato adecuado
//     mapdata = data.map(d => ({
//         name: d.name,
//         value: +d.value  // Convertir a número
//     }));
//   });

mapdata = [
  { id: "01", name: "Tarapacá", value: 0 },
  { id: "02", name: "Antofagasta", value: 2 },
  { id: "03", name: "Atacama", value: 1 },
  { id: "04", name: "Coquimbo", value: 0 },
  { id: "05", name: "Valparaíso", value: 28 },
  { id: "06", name: "O'Higgins", value: 3 },
  { id: "07", name: "Maule", value: 2 },
  { id: "08", name: "Bío-Bío", value: 9 },
  { id: "09", name: "La Araucanía", value: 9 },
  { id: "10", name: "Los Lagos", value: 1 },
  { id: "11", name: "Aysén", value: 4 },
  { id: "12", name: "Magallanes", value: 4 },
  { id: "13", name: "RM", value: 82 },
  { id: "14", name: "Los Ríos", value: 4 },
  { id: "15", name: "Arica", value: 3 },
  { id: "16", name: "Ñuble", value: 0 },
];


// Cargar el archivo GeoJSON desde la carpeta raíz
const geoJsonPath = "assets/regiones2.geojson";
 
function computeBoundingBox(feature) {
  const { geometry } = feature;
  if (!geometry || geometry.type !== 'Polygon') {
    console.warn("Geometría no válida o inesperada:", geometry);
    return null;
  }

  let allCoords = geometry.coordinates[0]; // Primer anillo del polígono (el exterior)
  
  if (!allCoords || !allCoords.length) {
    console.warn("No hay coordenadas en la geometría:", geometry);
    return null;
  }

  let minX = Infinity, 
      minY = Infinity, 
      maxX = -Infinity, 
      maxY = -Infinity;

  for (const [lng, lat] of allCoords) {
    if (lng < minX) minX = lng;
    if (lat < minY) minY = lat;
    if (lng > maxX) maxX = lng;
    if (lat > maxY) maxY = lat;
  }

  return [minX, minY, maxX, maxY];
}


// Tabla dinámica

const mapContainer = document.getElementById('map');

