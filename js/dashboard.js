


  /************************************************************
    3. Función de actualización del gráfico
       Parámetros:
       - variableSelectId:  ID del <select> que elige la variable
       - levelSelectId:     ID del <select> que elige el nivel de análisis
       - chartContainerId:  ID del contenedor donde se renderiza el gráfico
       - chartTitle:        Título del gráfico (opcional)
  *************************************************************/

  async function updateChart(variableSelectId, levelSelectId, chartContainerId, chartTitle) {
    const variable = document.getElementById(variableSelectId).value;
    const level = document.getElementById(levelSelectId).value;
    const container = document.getElementById(chartContainerId);
    const resetButtonId = chartContainerId === "chartContainer" ? "resetButton1" : "resetButton2";
    const resetButton = document.getElementById(resetButtonId);

    updateAnalysisLevels(variable, "selector1b");

    const fileName = variableToFileMap[variable];
    if (!fileName) {
        console.error("No se encontró archivo CSV para la variable:", variable);
        return;
    }

    const data = await loadDataFromCSV(fileName);
    if (!data || data.length === 0) {
        console.error("No hay datos para generar gráfico.");
        return;
    }

    let grouped = {};
    let categories = [];
    let subCategories = [];
    let isZoomed = false; // Controla si ya se hizo zoom

    if (level === "nacional") {
        const groupedData = data.reduce((acc, row) => {
            const key = row[variable];
            if (!key) return acc;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const total = Object.values(groupedData).reduce((sum, v) => sum + v, 0);
        const pieData = Object.entries(groupedData).map(([k, v]) => ({
            name: k,
            value: ((v / total) * 100).toFixed(2),
        }));

        option = {
            title: { text: chartTitle || "Distribución Nacional", left: "center" },
            tooltip: { trigger: "item", formatter: "{a} <br/>{b}: {c}%" },
            legend: { top: "bottom" },
            series: [
                {
                    name: "Distribución",
                    type: "pie",
                    radius: ["30%", "70%"],
                    roseType: "radius",
                    itemStyle: { borderRadius: 5 },
                    data: pieData,
                },
            ],
        };
    } else {
        data.forEach((row) => {
            const levelKey = row[level];
            const varKey = row[variable];
            if (!levelKey || !varKey) return;
            if (!grouped[levelKey]) {
                grouped[levelKey] = {};
            }
            grouped[levelKey][varKey] = (grouped[levelKey][varKey] || 0) + 1;
        });

        categories = Object.keys(grouped);
        subCategories = Array.from(
            new Set(Object.values(grouped).flatMap((obj) => Object.keys(obj)))
        );

        const series = subCategories.map((subCat) => {
            return {
                name: subCat,
                type: "bar",
                data: categories.map((cat) => grouped[cat][subCat] || 0),
            };
        });

        option = {
            title: { text: chartTitle || `Distribución por ${level}`, left: "center" },
            tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
            legend: { top: "bottom", data: subCategories }, // Inicializar la leyenda con todas las subcategorías
            xAxis: { type: "value", name: "Valores" },
            yAxis: { type: "category", data: categories, name: "Categorías" },
            series: series,
        };
    }

    if (!container) {
        console.error("No se encontró contenedor para el ID:", chartContainerId);
        return;
    }
    if (chartInstances[chartContainerId]) {
        chartInstances[chartContainerId].dispose();
    }
    const chart = echarts.init(container);
    chart.setOption(option);
    chartInstances[chartContainerId] = chart;

    // Agregar evento para hacer zoom en la categoría seleccionada
    chart.on("click", function (params) {
        if (isZoomed) return; // Evita zoom múltiple

        if (!subCategories || subCategories.length === 0) {
            console.error("Error: subCategories no está definido.");
            return;
        }
        const selectedCategory = params.name;

        const filteredSeries = subCategories.map((subCat) => {
            return {
                name: subCat,
                type: "bar",
                data: categories.map((cat) =>
                    cat === selectedCategory ? grouped[cat][subCat] || 0 : 0
                ),
                emphasis: {
                    focus: "series",
                },
            };
        });

        // Actualizar la leyenda para que solo muestre las series activas
        const activeLegend = subCategories.filter((subCat) => {
            return categories.some((cat) => cat === selectedCategory && grouped[cat][subCat]);
        });

        chart.setOption({
            title: { text: `Distribución por ${level}: ${selectedCategory}` },
            yAxis: { type: "category", data: [selectedCategory] },
            series: filteredSeries,
            // legend: { top: "bottom", data: activeLegend }, // Actualizar leyenda con solo los valores activos
        });

        // Mostrar el botón de reset cuando se hace zoom
        resetButton.style.display = "block";
        isZoomed = true;
    });

    // Agregar evento al botón para restablecer el gráfico
    resetButton.onclick = function () {
        chart.setOption(option);
        resetButton.style.display = "none";
        isZoomed = false;
      };
    }
    
    
      /************************************************************
        4. Listeners para los 2 conjuntos de selectores
      *************************************************************/
    
        // // 1) Primer set: características generales
        // const selVarGenerales = document.getElementById("selectorGeneralesInteres");
        // const selNivelGenerales = document.getElementById("selectorTecnoAnalisis");

// document.addEventListener("DOMContentLoaded", () => {

//         // Al cambiar la variable o el nivel, actualizar el gráfico
//         selVarGenerales.addEventListener("change", () => {          
//           updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
//         });
//         selNivelGenerales.addEventListener("change", () => {
//           updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
//         });
      
//         // 2) Segundo set: características tecnocreativas
//         const selVarTecno = document.getElementById("selector2b");
//         const selNivelTecno = document.getElementById("selector1b");
    
    
      
//         selVarTecno.addEventListener("change", () => {
//           updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
//         });
//         selNivelTecno.addEventListener("change", () => {
//           updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
//         });

// });

// if (selVarGenerales && selNivelGenerales) {
//   selVarGenerales.addEventListener("change", () => {
//       updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
//   });
//   selNivelGenerales.addEventListener("change", () => {
//       updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
//   });
// }

// if (selVarTecno && selNivelTecno) {
//   selVarTecno.addEventListener("change", () => {
//       updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
//   });
//   selNivelTecno.addEventListener("change", () => {
//       updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
//   });
// }

// //         // OPCIONAL: Disparar carga inicial (ej: por defecto)
// updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
// updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
      


// Obtener los elementos del DOM
selVarGenerales = document.getElementById("selectorGeneralesInteres");
selNivelGenerales = document.getElementById("selectorTecnoAnalisis");
selVarTecno = document.getElementById("selector2b");
selNivelTecno = document.getElementById("selector1b");

// console.log(selVarGenerales);

// document.addEventListener("DOMContentLoaded", () => {
//   console.log("DOM completamente cargado");

// window.addEventListener("visibilitychange", () => {
//   if (document.hidden) {
//       // Limpiar variables cuando la pestaña se oculta
//       selVarGenerales = null;
//       selNivelGenerales = null;
//       selVarTecno = null;
//       selNivelTecno = null;
//   } else {
//       // Volver a asignar cuando la pestaña se activa nuevamente
//       selVarGenerales = document.getElementById("selectorGeneralesInteres");
//       selNivelGenerales = document.getElementById("selectorTecnoAnalisis");
//       selVarTecno = document.getElementById("selector2b");
//       selNivelTecno = document.getElementById("selector1b");
//   }
// });

  // Obtener elementos

  // Verificar que los elementos existen
  if (!selVarGenerales || !selNivelGenerales) {
      console.error("Error: No se encontraron elementos para selectorGeneralesInteres o selectorTecnoAnalisis");
  }
  if (!selVarTecno || !selNivelTecno) {
      console.error("Error: No se encontraron elementos para selector2b o selector1b");
  }

  // Asignar eventos
  selVarGenerales.addEventListener("change", () => {
      updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
  });

  selNivelGenerales.addEventListener("change", () => {
      updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
  });

  selVarTecno.addEventListener("change", () => {
      updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
  });

  selNivelTecno.addEventListener("change", () => {
      updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
  });

  // Cargar gráficos iniciales
  updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
  updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");

  console.log("Gráficos inicializados correctamente.");
// });




  /************************************************************
    5. Grafico de Mapa
  *************************************************************/

// const data = [
//   { id: "01", name: "Tarapacá", value: 0 },
//   { id: "02", name: "Antofagasta", value: 2 },
//   { id: "03", name: "Atacama", value: 1 },
//   { id: "04", name: "Coquimbo", value: 0 },
//   { id: "05", name: "Valparaíso", value: 28 },
//   { id: "06", name: "O'Higgins", value: 3 },
//   { id: "07", name: "Maule", value: 2 },
//   { id: "08", name: "Bío-Bío", value: 9 },
//   { id: "09", name: "La Araucanía", value: 9 },
//   { id: "10", name: "Los Lagos", value: 1 },
//   { id: "11", name: "Aysén", value: 4 },
//   { id: "12", name: "Magallanes", value: 4 },
//   { id: "13", name: "RM", value: 82 },
//   { id: "14", name: "Los Ríos", value: 4 },
//   { id: "15", name: "Arica", value: 3 },
//   { id: "16", name: "Ñuble", value: 0 },
// ];




fetch(geoJsonPath)
  .then(response => response.json())
  .then(regionesGeoJSON => {
    // Inicializar el mapa con ECharts
    const chart = echarts.init(document.getElementById('map'));

    echarts.registerMap('chile', regionesGeoJSON);

    const option = {
      title: {
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
      visualMap: {
        min: 0,
        max: 100, // Ajustar de acuerdo a los datos reales
        text: ['Alto', 'Bajo'],
        realtime: true,
        calculable: true,
        inRange: {
          color: ['#f2f0f7', '#2b8cbe'],
        },
        right: '5%',
        top: 'middle',
      },
      series: [
        {
          type: 'map',
          map: 'chile',
          // zoom: 1.2,
          roam: true,
          data: mapdata.map(d => ({ name: d.name, value: d.value })),
          emphasis: {
            label: {
              show: true,
            },
          },
        },
      ],
    };

    chart.setOption(option);

    // Evento para hacer zoom en la región seleccionada
    chart.on('click', function (params) {
      if (params.name) {
        const selectedFeature = regionesGeoJSON.features.find(
          feature => feature.properties.name === params.name
        );
        console.log("Región seleccionada:", params.name);
        console.log("Feature seleccionado:", selectedFeature);
    
        if (selectedFeature) {
          // Crear un nuevo GeoJSON solo con la región seleccionada
          const filteredGeoJSON = {
            type: "FeatureCollection",
            features: [selectedFeature]
          };
    
          // Registrar solo la nueva geometría en ECharts
          echarts.registerMap("regionSeleccionada", filteredGeoJSON);
    
          // Configurar la vista para que muestre solo la región seleccionada
          chart.setOption({
            series: [
              {
                type: 'map',
                map: 'regionSeleccionada', // Usamos el nuevo mapa con solo la región seleccionada
                roam: true,
                zoom: 1,
                data: mapdata.map(d => ({
                  name: d.name,
                  value: d.value
                })),
                emphasis: {
                  label: { show: true }
                }
              }
            ]
          });
        }
      }
    });
    
})
  .catch(error => {
    console.error("Error cargando el archivo GeoJSON:", error);
  });
