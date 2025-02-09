


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
    

// Obtener los elementos del DOM
selVarGenerales = document.getElementById("selectorGeneralesInteres");
selNivelGenerales = document.getElementById("selectorTecnoAnalisis"); 

selVarTecno = document.getElementById("selector2b");
selNivelTecno = document.getElementById("selector1b");



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


fetch(geoJsonPath)
  .then(response => response.json())
  .then(regionesGeoJSON => {
    const chart = echarts.init(document.getElementById('map'));
    echarts.registerMap('chile', regionesGeoJSON);

    let isZoomed = false; // Estado de zoom en el mapa

    const originalOption = {
      title: { left: 'center' },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
      visualMap: {
        min: 1,
        max: 40,
        text: ['Alto', 'Bajo'],
        realtime: true,
        calculable: true,
        inRange: { 
          color: [ '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        outOfRange: {
          color: '#D3D3D3'  // Asegura que los valores fuera de rango (como 0) sean grises
        },
        right: '5%',
        top: 'middle',
      },
      series: [
        {
          type: 'map',
          map: 'chile',
          roam: false,
          data: mapdata.map(d => ({ name: d.name, value: d.value })),
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#FFD654' }
          }
        }
      ]
    };

    chart.setOption(originalOption);

    

    // Función para resetear el mapa
    function resetMap() {
      isZoomed = false;
      document.getElementById('resetButton').classList.add('d-none');

      // Restaurar columnas
      document.getElementById('mapColumn').classList.remove('col-md-6');
      document.getElementById('mapColumn').classList.add('col-md-12');
      document.getElementById('detailsColumn').classList.add('d-none');

      // Restaurar configuración original del mapa
      chart.setOption(originalOption, true);
      chart.resize();
    }

    // Evento para hacer zoom al hacer clic en una región
    chart.on('click', function (params) {
      if (isZoomed) {
        resetMap();
        return;
      }

      if (params.name) {
        const regionData = mapdata.find(d => d.name === params.name);

        // Evita clic en regiones con value = 0
        if (!regionData || regionData.value === 0) {
          console.log(`La región ${params.name} no tiene datos.`);
          return;
        }

        const selectedFeature = regionesGeoJSON.features.find(
          feature => feature.properties.name === params.name
        );

        if (selectedFeature) {
          isZoomed = true;

          // Registrar solo la región seleccionada en ECharts
          const filteredGeoJSON = {
            type: "FeatureCollection",
            features: [selectedFeature]
          };

          echarts.registerMap("regionSeleccionada", filteredGeoJSON);

          // Modificar estructura para dividir en dos columnas
          const mapColumn = document.getElementById('mapColumn');
          const detailsColumn = document.getElementById('detailsColumn');

          mapColumn.classList.remove('col-md-12');
          mapColumn.classList.add('col-md-6');
          detailsColumn.classList.remove('d-none');

          // Mostrar el botón de reset
          document.getElementById('resetButton').classList.remove('d-none');

          // Redibujar el mapa con zoom en la región
          chart.setOption({
            visualMap: { show: false }, // Oculta el visualMap
            series: [
              {
                type: 'map',
                map: 'regionSeleccionada',
                roam: false,
                zoom: 1.2, // Ajustar zoom
                data: mapdata.map(d => ({ name: d.name, value: d.value })),
                emphasis: { label: { show: false } }
              }
            ]
          });

          // Forzar actualización de tamaño del mapa
          setTimeout(() => {
            chart.resize();
          }, 0);

          // Generar gráficos en la nueva sección
          renderCharts();
        }
      }
    });

        // Función para generar gráficos en las 3 filas
        function renderCharts() {
          const chart1 = echarts.init(document.getElementById('chart1'));
          const chart2 = echarts.init(document.getElementById('chart2'));
          const chart3 = echarts.init(document.getElementById('chart3'));
    
          const optionBar = {
            xAxis: { type: 'category', data: ['A', 'B', 'C', 'D'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [10, 20, 30, 40] }]
          };
    
          const optionPie = {
            series: [
              {
                type: 'pie',
                data: [
                  { value: 40, name: 'X' },
                  { value: 30, name: 'Y' },
                  { value: 20, name: 'Z' }
                ]
              }
            ]
          };
    
          chart1.setOption(optionBar);
          chart2.setOption(optionPie);
          chart3.setOption(optionBar);
        }

    // Agregar evento al botón de reset
    document.getElementById('resetButton').addEventListener('click', resetMap);

  });

  // Después de instanciarlos:
detailChart1 = echarts.init(document.getElementById('chart1'));
detailChart2 = echarts.init(document.getElementById('chart2'));
detailChart3 = echarts.init(document.getElementById('chart3'));


    // 5. Ajustamos tamaño dinámicamente al cambiar la ventana
    window.addEventListener('resize', () => {
      if (chartContainer) chartContainer.resize();
      if (chartContainer2)chartContainer2.resize();
      if (chart) chart.resize(); // <-- el mapa
      if (detailChart1) detailChart1.resize();
      if (detailChart2) detailChart2.resize();
      if (detailChart3) detailChart3.resize();
    });