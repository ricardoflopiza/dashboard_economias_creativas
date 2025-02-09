


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
    
            // Ordenar las subcategorías si la variable es "tamano_empresa_num_trab"
            if (variable === "tamano_empresa_num_trab") {
                const ordenTamano = ["0", "1-5", "6-10", "11-50", "Más de 50"];
                subCategories.sort((a, b) => {
                    return ordenTamano.indexOf(a) - ordenTamano.indexOf(b);
                });
            }

                        // Ordenar las subcategorías si la variable es "tamano_empresa_num_trab"
                        if (variable === "rango_ventas") {
                          const ordenTamano = ["Menos de 10.000 USD", "Entre 10.000 y 50.000 USD", "Entre 50.000 y 100.000 USD", "Más de 100.000 USD"];
                          subCategories.sort((a, b) => {
                              return ordenTamano.indexOf(a) - ordenTamano.indexOf(b);
                          });
                      }
    
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
                legend: { top: "bottom", data: subCategories },
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
    
        // Evento para hacer zoom
        chart.on("click", function (params) {
            if (isZoomed) return;
    
            const selectedCategory = params.name;
            const filteredSeries = subCategories.map((subCat) => {
                return {
                    name: subCat,
                    type: "bar",
                    data: categories.map((cat) =>
                        cat === selectedCategory ? grouped[cat][subCat] || 0 : 0
                    ),
                    emphasis: { focus: "series" },
                };
            });
    
            chart.setOption({
                title: { text: `Distribución por ${level}: ${selectedCategory}` },
                yAxis: { type: "category", data: [selectedCategory] },
                series: filteredSeries,
            });
    
            resetButton.style.display = "block";
            isZoomed = true;
        });
    
        // Evento para restablecer el gráfico
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

    let isZoomed = false;

    // Calcular el total de casos a nivel nacional
    const totalCasosNacional = mapdata.reduce((sum, d) => sum + d.value, 0);

    // Opción inicial: Mapa de Chile completo
    const originalOption = {
      title: { text: `Nacional - Total de casos: ${totalCasosNacional}`, left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      visualMap: {
        min: 1,
        max: 40,
        text: ['Alto', 'Bajo'],
        realtime: true,
        calculable: true,
        inRange: { 
          color: ['#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        outOfRange: { color: '#D3D3D3' },
        right: '5%',
        top: 'middle'
      },
      series: [
        {
          type: 'map',
          map: 'chile',
          roam: false,
          data: mapdata.map(d => ({ name: d.name, value: d.value })),
          label: { show: false },
          emphasis: { label: { show: false }, itemStyle: { areaColor: '#FFD654' } }
        }
      ]
    };

    chart.setOption(originalOption);

    // Mostrar gráficos a nivel nacional al cargar
    renderCharts('nacional');

    function resetMap() {
      isZoomed = false;
      document.getElementById('resetButton').classList.add('d-none');
      chart.setOption(originalOption, true);
      chart.resize();
      renderCharts('nacional');
    }

    chart.on('click', function (params) {
      if (isZoomed) {
        resetMap();
        return;
      }

      const regionName = params.name;
      const regionData = mapdata.find(d => d.name === regionName);

      if (!regionData || regionData.value === 0) {
        console.log(`La región ${regionName} no tiene datos.`);
        return;
      }

      const selectedFeature = regionesGeoJSON.features.find(f => f.properties.name === regionName);

      if (!selectedFeature) {
        console.log(`No se encontró la región ${regionName} en el GeoJSON.`);
        return;
      }

      isZoomed = true;
      document.getElementById('resetButton').classList.remove('d-none');

      echarts.registerMap('regionSeleccionada', { type: "FeatureCollection", features: [selectedFeature] });

      chart.setOption({
        title: { text: `${regionName} - Total de casos: ${regionData.value}`, left: 'center' },
        visualMap: { show: false },
        series: [{
          type: 'map',
          map: 'regionSeleccionada',
          roam: false,
          zoom: 1.2,
          data: [regionData],
          emphasis: { label: { show: false } }
        }]
      });

      setTimeout(() => chart.resize(), 0);
      renderCharts(regionName);
    });

    function renderCharts(regionName) {
      const chart1 = echarts.init(document.getElementById('chart1'));
      const chart2 = echarts.init(document.getElementById('chart2'));
      const chart3 = echarts.init(document.getElementById('chart3'));

      chart1.clear(); 
      chart2.clear(); 
      chart3.clear();

      loadDataFromCSV('df_select.csv').then(allRows => {
        const filtered = (regionName === 'nacional') ? allRows : allRows.filter(r => r.region === regionName);

        if (!filtered.length) {
          console.log(`No hay datos para la región: ${regionName}`);
          return;
        }

        const generoData = preparePieData(filtered, 'genero');
        const tipoData = prepareBarData(filtered, 'tipo_empresa');
        const cadenaData = preparePieData(filtered, 'cadena_productiva');

        chart1.setOption(createPieChartOption('Género', regionName, generoData));
        chart2.setOption(createBarChartOption('Tipo de Empresa', regionName, tipoData));
        chart3.setOption(createPieChartOption('Cadena Productiva', regionName, cadenaData));

        chart1.resize();
        chart2.resize();
        chart3.resize();
      }).catch(err => console.error('Error CSV:', err));
    }

    function preparePieData(data, field) {
      const count = {};
      data.forEach(item => { if (item[field]) count[item[field]] = (count[item[field]] || 0) + 1; });
      const total = Object.values(count).reduce((a, b) => a + b, 0);
      return Object.entries(count).map(([key, value]) => ({ name: key, value: ((value / total) * 100).toFixed(1) }));
    }

    function prepareBarData(data, field) {
      const count = {};
      data.forEach(item => { if (item[field]) count[item[field]] = (count[item[field]] || 0) + 1; });
      return Object.entries(count).map(([key, value]) => ({ name: key, value }));
    }

    function createPieChartOption(title, regionName, data) {
      return {
        title: { text: `${title} - ${regionName}`, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        series: [{ type: 'pie', radius: ['30%', '70%'], center: ['50%', '50%'], data, label: { formatter: '{b}: {c}%' } }]
      };
    }

    function createBarChartOption(title, regionName, data) {
      return {
        title: { text: `${title} - ${regionName}`, left: 'center' },
        tooltip: { trigger: 'axis' },
        grid: { left: '10%', right: '10%', bottom: '20%', containLabel: true },
        xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { interval: 0, rotate: 30 } },
        yAxis: { type: 'value' },
        series: [{ name: 'Cantidad', type: 'bar', data: data.map(d => d.value) }]
      };
    }

    window.addEventListener('resize', () => {
      chart1.resize();
      chart2.resize();
      chart3.resize();
    });

    document.getElementById('resetButton').addEventListener('click', resetMap);
  });


  

    // 5. Ajustamos tamaño dinámicamente al cambiar la ventana
    window.addEventListener('resize', () => {
      // if (chartContainer) chartContainer.resize();
      if (chartContainer2) chartContainer2.resize();
      if (chart) chart.resize(); // <-- el mapa
      if (detailChart1) detailChart1.resize();
      if (detailChart2) detailChart2.resize();
      if (detailChart3) detailChart3.resize();
    });