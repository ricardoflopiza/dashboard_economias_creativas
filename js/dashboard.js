


  /************************************************************
    3. Función de actualización del gráfico
       Parámetros:
       - variableSelectId:  ID del <select> que elige la variable
       - levelSelectId:     ID del <select> que elige el nivel de análisis
       - chartContainerId:  ID del contenedor donde se renderiza el gráfico
       - chartTitle:        Título del gráfico (opcional)
  *************************************************************/
      isMobile = window.innerWidth <= 768;


       async function updateChart(variableSelectId, levelSelectId, chartContainerId, chartTitle) {
        const variable = document.getElementById(variableSelectId).value;
        const level = document.getElementById(levelSelectId).value;
        const container = document.getElementById(chartContainerId);
        const resetButtonId = chartContainerId === "chartContainer" ? "resetButton1" : "resetButton2";
        const resetButton = document.getElementById(resetButtonId);

        // Si ya existe un chart anterior, lo destruimos
if (chartInstances[chartContainerId]) {
  chartInstances[chartContainerId].dispose();
  chartInstances[chartContainerId] = null;
}

// Ocultar el botón de restablecimiento
resetButton.style.display = "none";
      

        updateAnalysisLevels(variable, "selector1b");
      
        const fileName = variableToFileMap[variable];
        if (!fileName) {
          console.error("No se encontró archivo CSV para la variable:", variable);
          return;
        }
      
        let data = await loadDataFromCSV(fileName);
        if (!data || data.length === 0) {
          console.error("No hay datos para generar gráfico.");
          return;
        }
      
        // Función personalizada para formatear el tooltip
        function customTooltipFormatter(params) {
          if (!Array.isArray(params)) {
            params = [params];
          }
      
          let total = 0;
          params.forEach(item => {
            const value = Array.isArray(item.value) ? Number(item.value[1]) : Number(item.value);
            total += value;
          });
      
          if (level === "nacional") {
            params.sort((a, b) => Number(b.value) - Number(a.value));
          } else {
            params.sort((a, b) => subCategories.indexOf(a.seriesName) - subCategories.indexOf(b.seriesName));
          }
      
          let res = `<div><strong>${params[0].name}</strong></div>`;
          params.forEach(item => {
            const value = Number(item.value);
            if (value > 0) {
              if (level === "nacional") {
                
                res += `
                  <div style='margin:5px 0;'>
                    <span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:5px;'></span>
                    ${item.seriesName}: ${value}
                  </div>
                `;
              } else {
                const percent = ((value / total) * 100).toFixed(2);
                res += `
                  <div style='margin:5px 0;'>
                    <span style='display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:5px;'></span>
                    ${item.seriesName}: ${value} (${percent}%)
                  </div>
                `;
              }
            }
          });
          res += `<div><strong>Total: ${total}</strong></div>`;
          return res;
        }
      
        let option;
        let grouped = {};
        let categories = [];
        let subCategories = [];
        let isZoomed = false; // Controla si ya se hizo zoom
        let colorMapping = {};

      
        // Definimos el campo de color según la variable seleccionada
        const colorField = 'color_' + variable;
      
////////////////////////////////////////////////////////////////

// NACIONAL 

////////////////////////////////////////////////////////////////

////////////////////////////////

// NACIONAL mobile

////////////////////////////////

        if (level === "nacional") {
          // Si se trata de chartContainer2 en móvil, mostramos gráfico de barras horizontales
          if (isMobile) {
            if (variable === "exportaciones_porc_ingreso") {
              data = data.filter(row => row[variable] !== "Sin ingresos%");
              data = data.filter(row => row[variable] !== "NA%");

            }
            
            // Agrupar datos y extraer el color dinámico (se toma el primer color encontrado)
            const groupedData = data.reduce((acc, row) => {
              const key = row[variable];
              if (!key) return acc;
              if (!acc[key]) {
                acc[key] = {
                  count: 0,
                  color: row[colorField] || '#ccc'
                };
              }
              acc[key].count += 1;
              return acc;
            }, {});
            
            // Extraer las categorías y generar los datos para las barras
            const categories = Object.keys(groupedData);
            // Calcular el total para luego obtener los porcentajes
            const total = Object.values(groupedData).reduce((sum, group) => sum + group.count, 0);
            const barData = categories.map(cat => ({
              name: cat,
              value: groupedData[cat].count,
              itemStyle: { color: groupedData[cat].color }
            }));
            
            // Configuración para gráfico de barras horizontales con etiquetas que muestran el valor y porcentaje,
            // y con etiquetas en el eje Y que "wrapean" si son muy largas.
            option = {
              grid: { containLabel: true,
                left: '5%', right: '20%', top: '10%', bottom: '10%'
               },
              title: { text: chartTitle || "Distribución Nacional", left: "center" },
              tooltip: { 
                trigger: "axis", 
                formatter: customTooltipFormatter
              },
              legend: { show: false },
              xAxis: {
                type: "value",
                name: "Cantidad",
                axisLabel: {
                  textStyle: { color: "#000" }} // Color más oscuro
              },
              yAxis: {
                type: "category",
                data: categories,
                name: "Categorías",
                inverse: true,
                axisLabel: {
                  textStyle: { color: "#000" }, // Color más oscuro
                  formatter: function(value) {
                    return wrapText(value, 10);
                  }
                }
              },
              series: [
                {
                  name: "Distribución",
                  type: "bar",
                  data: barData,
                  label: {
                    show: true,
                    fontSize: 12,
                    backgroundColor: '#cbd2d3',
                    borderWidth: 1,
                    borderRadius: 4,
                    padding: [5, 10],
                    position: "right",  // Etiquetas a la derecha de cada barra
                    formatter: function(params) {
                      const count = params.value;
                      const percent = ((count / total) * 100).toFixed(2) + '%';
                      return count + " (" + percent + ")";
                    }
                  }
                },
              ],
            };
            

////////////////////////////////

// NACIONAL escritorio

////////////////////////////////

          } else {

            // --- GRÁFICO DE TORTA (PIE CHART) PARA DESKTOP ---
            if (variable === "exportaciones_porc_ingreso") {
              data = data.filter(row => row[variable] !== "Sin ingresos%");
            }
            
            // Agrupar datos y extraer color dinámico
            const groupedData = data.reduce((acc, row) => {
              const key = row[variable];
              if (!key) return acc;
              if (!acc[key]) {
                acc[key] = {
                  count: 0,
                  color: row[colorField] || '#ccc'
                };
              }
              acc[key].count += 1;
              return acc;
            }, {});
            
            const total = Object.values(groupedData).reduce((sum, group) => sum + group.count, 0);
            const pieData = Object.entries(groupedData).map(([k, group]) => ({
              name: k,
              value: group.count,
              itemStyle: { color: group.color }
            }));
            
            option = {
              title: { text: chartTitle || "Distribución Nacional", left: "center" },
              tooltip: { 
                trigger: "item", 
                formatter: customTooltipFormatter
              },
              legend: { top: "bottom" },
              series: [
                {
                  name: "Distribución",
                  type: "pie",
                  radius: ["30%", "70%"],
                  roseType: "radius",
                  itemStyle: { borderRadius: 5 },
                  emphasis: { disabled: true },
                  label: {
                    formatter: '{b}:\n{d}%',
                    fontSize: 16,
                    backgroundColor: '#cbd2d3',
                    borderWidth: 1,
                    borderRadius: 4,
                    padding: [5, 10]
                  },
                  data: pieData,
                },
              ],
            };
          }
        //// graficos nivel no nacional
        } else {
      
          if (variable === "exportaciones_porc_ingreso") {
            data = data.filter(row => row[variable] !== "Sin ingresos%");
            data = data.filter(row => row[variable] !== "NA%");


          }
      
          // Creamos un mapping de colores para cada valor de la variable
          data.forEach(row => {
            const varKey = row[variable];
            if (varKey && !colorMapping[varKey]) {
              colorMapping[varKey] = row[colorField] || '#ccc';
            }
          });
      
          // Agrupamos los datos por el nivel y la variable
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
      
          const customOrders = {
            tamano_empresa_num_trab: ["0", "1-5", "6-10", "11-50", "Más de 50"],
            rango_ventas: [
              "Menos de 10.000 USD",
              "Entre 10.000 y 50.000 USD",
              "Entre 50.000 y 100.000 USD",
              "Más de 100.000 USD",
            ],
            porc_exportaciones: ["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"]
          };
      
          if (customOrders[variable]) {
            const orderArray = customOrders[variable];
            subCategories.sort((a, b) => orderArray.indexOf(a) - orderArray.indexOf(b));
          }
      
          // Generamos las series para el gráfico de barras, asignando el color dinámico a cada subcategoría
          const series = subCategories.map((subCat) => {
            return {
              name: subCat,
              type: "bar",
              stack: 'total',  // <-- propiedad clave para apilarlas
              itemStyle: { color: colorMapping[subCat] || '#ccc' },
              data: categories.map((cat) => grouped[cat][subCat] || 0),
            };
          });
      
          option = {
            grid: { containLabel: true },
            title: { text: chartTitle || `Distribución por ${level}`, left: "center" },
            tooltip: { 
              trigger: "axis", 
              axisPointer: { type: "shadow" },
              formatter: customTooltipFormatter
            },
            legend: { top: "bottom", data: subCategories },
            xAxis: { type: "value", name: "Cantidad" },
            yAxis: { type: "category", data: categories, name: "", inverse: true,
              axisLabel: {
                textStyle: { color: "#000" }, // Color más oscuro
                formatter: function(value) {
                  return wrapText(value, 10);
                }
              }
             },
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
      
        // Evento para hacer zoom en el gráfico de barras (nivel distinto de "nacional")
// Evento para hacer zoom en el gráfico de barras (nivel distinto de "nacional")
if (level !== "nacional") {
  chart.on("click", function (params) {
    if (isZoomed) return;
    
    let selectedCategory = null;
    if (params.componentType === 'series') {
      selectedCategory = params.name;
    } else if (params.componentType === 'yAxis') {
      selectedCategory = params.value;
    }
    if (!selectedCategory) return;

    // 1. Construir los datos para el gráfico circular
    const pieData = subCategories.map((subCat) => ({
      name: subCat,
      value: grouped[selectedCategory][subCat] || 0,
      itemStyle: { color: colorMapping[subCat] || '#ccc' }
    })).filter(item => item.value > 0);


    // 2. Crear el objeto de configuración (pieOption)
    const pieOption = {
      title: { 
        text: `Distribución por ${level}: ${selectedCategory}`, 
        left: "center" 
      },
      tooltip: { 
        trigger: "item", 
        formatter: '{b}: {c}',
      },
      // En un gráfico circular no hacen falta ejes
      xAxis: { show: false },
      yAxis: { show: false },
      legend: { top: "bottom" },
      series: [
        {
          name: "Distribución",
          type: "pie",
          radius: ["30%", "70%"],
          roseType: "radius",
          itemStyle: { borderRadius: 5 },
          emphasis: { disabled: true },
          label: { formatter: '{b}:\n{d}%' },
          data: pieData,
        },
      ],
    };

    // 3. Limpiar el gráfico antes de aplicar la nueva configuración
    chart.clear();

    // 4. Aplicar la nueva configuración sin mezclarla con la anterior
    chart.setOption(pieOption, { notMerge: true });

    // Ocultar tooltip, mostrar botón y marcar que ya se hizo zoom
    chart.dispatchAction({ type: 'hideTip' });
    resetButton.style.display = "block";
    isZoomed = true;
  });
}


      
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

updateChart
updateChart


  /************************************************************
    5. Grafico de Mapa
  *************************************************************/

// Declaración global para la instancia del mapa y la opción original

// Función para inicializar el mapa
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error("No se encontró el contenedor del mapa.");
    return;
  }

  // Si ya existe una instancia previa, la desecha
  if (mapChart) {
    mapChart.dispose();
  }
  mapChart = echarts.init(mapContainer);

  fetch(geoJsonPath)
    .then(response => response.json())
    .then(regionesGeoJSON => {
      echarts.registerMap('chile', regionesGeoJSON);

      let isZoomed = false;
      const totalCasosNacional = mapdata.reduce((sum, d) => sum + d.value, 0);

      // Definir la opción inicial del mapa
      originalMapOption = {
        title: { text: `Nacional\nTotal de casos: ${totalCasosNacional}`, left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c}' },
        visualMap: {
          type: 'piecewise',
          pieces: [
            { value: 0, color: '#D3D3D3', label: 'Sin datos' },
            { min: 1, max: 10, color: '#F7E3AF', label: '1 a 10' },
            { min: 11, max: 20, color: '#F4C774', label: '11 a 20' },
            { min: 21, max: 30, color: '#E39A49', label: '21 a 30' },
            { min: 31, max: 100, color: '#C7652B', label: 'Más de 31' }
          ],
          realtime: true,
          calculable: true,
          right: '5%',
          top: 'middle'
        },
        series: [
          {
            type: 'map',
            map: 'chile',
            roam: false,
            selectedMode: false,
            data: mapdata.map(d => ({
              name: d.name,
              value: d.value,
              emphasis: {
                areaColor: d.value === 0 ? '#D3D3D3' : '#FFD654'
              }
            })),
            label: { show: false },
            emphasis: { label: { show: false } }
          }
        ]
      };

      mapChart.setOption(originalMapOption);

      // Se pueden agregar eventos, por ejemplo:
      mapChart.on('click', function (params) {
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

        mapChart.setOption({
          title: { 
            text: `${regionName} - Total de casos: ${regionData.value}`, 
            left: 'center' 
          },
          visualMap: { show: false },
          series: [{
            type: 'map',
            map: 'regionSeleccionada',
            roam: false,
            zoom: 1.2,
            data: [regionData],
            label: {
              show: true,
              formatter: '{b}'
            },
            emphasis: {
              itemStyle: {
                areaColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#abd9e9' },
                  { offset: 0.14, color: '#e0f3f8' },
                  { offset: 0.28, color: '#ffffbf' },
                  { offset: 0.42, color: '#fee090' },
                  { offset: 0.57, color: '#fdae61' },
                  { offset: 0.71, color: '#f46d43' },
                  { offset: 0.85, color: '#d73027' },
                  { offset: 1, color: '#a50026' }
                ])
              },
              label: { show: true }
            }
          }]
        });
        // Forzar resize
        setTimeout(() => mapChart.resize(), 0);
        renderCharts(regionName);
      });

      function resetMap() {
        isZoomed = false;
        document.getElementById('resetButton').classList.add('d-none');
        mapChart.setOption(originalMapOption, true);
        mapChart.resize();
        renderCharts('nacional');
      }

      document.getElementById('resetButton').addEventListener('click', resetMap);

      // Listener para redimensionar el mapa
      window.addEventListener('resize', debounce(() => {
        mapChart.setOption(originalMapOption, true);
        mapChart.resize();
      }, 100));
    })
    .catch(error => console.error("Error al cargar el mapa:", error));
}


initMap()


 // Función para transformar la primera letra en mayúscula
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Función para preparar datos de gráfico de pastel con colores dinámicos y filtrado de valores vacíos o "NA"
function preparePieDataWithColors(data, variable) {
  const colorField = 'color_' + variable; // Ej: "color_genero"
  const counts = {};

  data.forEach(item => {
    let key = item[variable];
    // Convertir a cadena y eliminar espacios
    key = key ? key.toString().trim() : "";
    // Si el valor está vacío o es "NA", se omite este registro
    if (!key || key.toUpperCase() === "NA") return;

    if (!counts[key]) {
      counts[key] = {
        name: key,
        value: 0,
        itemStyle: { color: item[colorField] || '#ccc' }
      };
    }
    counts[key].value += 1;
  });

  return Object.values(counts);
}

// Función para preparar datos de gráfico de barras con colores dinámicos y filtrado de valores vacíos o "NA"
function prepareBarDataWithColors(data, variable) {
  const colorField = 'color_' + variable;
  const counts = {};

  data.forEach(item => {
    let key = item[variable];
    // Convertir a cadena y eliminar espacios
    key = key ? key.toString().trim() : "";
    // Si el valor está vacío o es "NA", se omite este registro
    if (!key || key.toUpperCase() === "NA") return;

    if (!counts[key]) {
      counts[key] = {
        name: key,
        value: 0,
        itemStyle: { color: item[colorField] || '#ccc' }
      };
    }
    counts[key].value += 1;
  });

  return Object.values(counts);
}

// Función para crear la configuración del gráfico de pastel con porcentaje calculado manualmente
function createPieChartOption(title, regionName, data) {
  const formattedRegionName = capitalizeFirstLetter(regionName);
  const formattedTitle = title === 'Género' ? 'Género Persona\nEncuestada' : title;

  // Se calcula el total para mostrar porcentajes en el tooltip si se desea
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return {
    title: { 
      text: `${formattedTitle}\n${formattedRegionName}`, 
      left: 'left',
      top: '2%'  // 🔹 Mueve el título más arriba
    },
    tooltip: { 
      trigger: 'item', 
      formatter: function(params) {
        const percent = ((params.value / total) * 100).toFixed(2);
        return `${params.name}: ${params.value} (${percent}%)`;
      }
    },
    series: [{
      type: 'pie',
      radius: ['30%', '60%'],
      center: ['60%', '60%'], // 🔹 Baja el gráfico
      data: data,
      label: {
        formatter: '{b}:\n{d}%',
        fontSize: 12,
        backgroundColor: '#cbd2d3',
        borderWidth: 1,
        borderRadius: 4,
        padding: [5, 10]
      },
      itemStyle: { borderRadius: 5 },
      emphasis: { disabled: true }
    }]
  };
}


// Función para crear la configuración del gráfico de barras con porcentajes
function createBarChartOption(title, regionName, data) {

  const formattedRegionName = capitalizeFirstLetter(regionName);

  // Se asume que 'data' es un arreglo de objetos con { name, value }
  const total = data.reduce((sum, item) => sum + Number(item.value), 0);
  const percentageData = data.map(item => ({
    name: item.name,
    raw: Number(item.value),
    // Se calcula el porcentaje y se formatea con dos decimales
    percent: ((Number(item.value) / total) * 100).toFixed(2)
  }));

  return {
    grid: { containLabel: true },      
    title: {text:`${title}\n${formattedRegionName}`, 
      left: "left" },
    tooltip: { 
      trigger: 'item', 
      formatter: function(params) {
        // params.data contiene nuestro objeto con 'raw' y 'percent'
        return `${params.name}: ${params.data.raw} (${params.data.percent}%)`;
      }
    },
    xAxis: {
      type: "value",
      max: 100, // El porcentaje máximo es 100%
      name: "(%)"
    },
    yAxis: {
      type: "category",
      data: percentageData.map(item => item.name)
    },
    series: [{
      type: "bar",
      // Se asigna cada barra en base al porcentaje calculado
      data: percentageData.map(item => ({
        value: parseFloat(item.percent),
        raw: item.raw,
        percent: item.percent
      })),
      label: {
        show: true,
        position: "right",
        // Se muestra el porcentaje en la etiqueta
        formatter: "{c}%"
      }
    }]
  };
}


// Función principal para renderizar los gráficos en función de la región
function renderCharts(regionName) {
  const container1 = document.getElementById('chart1');
  const container2 = document.getElementById('chart2');
  const container3 = document.getElementById('chart3');

  // Se eliminan instancias previas de los gráficos
  if (chartInstances['chart1']) chartInstances['chart1'].dispose();
  if (chartInstances['chart2']) chartInstances['chart2'].dispose();
  if (chartInstances['chart3']) chartInstances['chart3'].dispose();

  const chart1 = echarts.init(container1);
  const chart2 = echarts.init(container2);
  const chart3 = echarts.init(container3);

  chartInstances['chart1'] = chart1;
  chartInstances['chart2'] = chart2;
  chartInstances['chart3'] = chart3;

  loadDataFromCSV('df_select.csv').then(allRows => {
    const filtered = (regionName === 'nacional') ? allRows : allRows.filter(r => r.region === regionName);

    if (!filtered.length) {
      console.log(`No hay datos para la región: ${regionName}`);
      return;
    }

    // Se preparan los datos con colores dinámicos y filtrado
    const generoData = preparePieDataWithColors(filtered, 'genero');
    const tipoData = prepareBarDataWithColors(filtered, 'tipo_empresa');
    const cadenaData = preparePieDataWithColors(filtered, 'cadena_productiva');

    // Se configuran los gráficos usando las funciones de opciones correspondientes
    chart1.setOption(createPieChartOption('Género', regionName, generoData));
    chart2.setOption(createBarChartOption('Tipo de Emprendimiento', regionName, tipoData));
    chart3.setOption(createPieChartOption('Cadena Productiva', regionName, cadenaData));

    chart1.resize();
    chart2.resize();
    chart3.resize();
  }).catch(err => console.error('Error al cargar CSV:', err));
}

renderCharts('nacional'); // Renderiza gráficos para la región "nacional" de forma predeterminada
// Declaración global de la variable currentRegion con un valor por defecto




// Inicializar el manejo de resize utilizando debounce

window.addEventListener('resize', debouncedResize);


  
  

    // // 5. Ajustamos tamaño dinámicamente al cambiar la ventana
    // // Initialize all chart instances
    // chartInstances['chart1'] = chart1;
    // chartInstances['chart2'] = chart2;
    // chartInstances['chart3'] = chart3;
    // chartInstances['map'] = chart;