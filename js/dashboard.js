


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
      
        if (level === "nacional") {
      
          if (variable === "exportaciones_porc_ingreso") {
            data = data.filter(row => row[variable] !== "Sin ingresos%");
          }
      
          // Agrupamos los datos y extraemos el color dinámico (se toma el primer color encontrado)
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
                  fontSize: 16,            // Tamaño de fuente mayor
                  backgroundColor: '#cbd2d3',   // Fondo blanco para la etiqueta
                  //borderColor: '#333',       // Borde gris oscuro
                  borderWidth: 1,            // Ancho del borde
                  borderRadius: 4,           // Bordes redondeados
                  padding: [5, 10]           // Espaciado interno (vertical, horizontal)
                },
                data: pieData,
              },
            ],
          };
      
        } else {
      
          if (variable === "exportaciones_porc_ingreso") {
            data = data.filter(row => row[variable] !== "Sin ingresos%");
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
            yAxis: { type: "category", data: categories, name: "", inverse: true },
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
  title: { text: `Nacional\nTotal de casos: ${totalCasosNacional}`, left: 'center' },
  tooltip: { trigger: 'item', formatter: '{b}: {c}' },
  visualMap: {
    min: 1,
    max: 40,
    text: ['Alto', 'Bajo'],
    realtime: true,
    calculable: true,
    inRange: { 
      color: ['#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
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
      selectedMode: false,
      data: mapdata.map(d => ({
        name: d.name,
        value: d.value,
        itemStyle:  d.value === 0 ? { areaColor: '#D3D3D3' } : {},
          emphasis: {
            areaColor: d.value === 0 ? '#D3D3D3' : '#FFD654'
          }
        
      })),
      label: { show: false },
      // Se elimina la configuración global de "emphasis" para que la de cada dato prevalezca
            // Desactiva las etiquetas en el estado de énfasis
            emphasis: { label: { show: false } }
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
              // Aquí definimos el degradado usando la misma paleta que el inRange
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
            label: {
              show: true
            }
          }
        }]
      });
      setTimeout(() => chart.resize(), 0);
      renderCharts(regionName);
    });

    // function renderCharts(regionName) {
    //   const chart1 = echarts.init(document.getElementById('chart1'));
    //   const chart2 = echarts.init(document.getElementById('chart2'));
    //   const chart3 = echarts.init(document.getElementById('chart3'));

    //   chart1.clear(); 
    //   chart2.clear(); 
    //   chart3.clear();

    //   loadDataFromCSV('df_select.csv').then(allRows => {
    //     const filtered = (regionName === 'nacional') ? allRows : allRows.filter(r => r.region === regionName);

    //     if (!filtered.length) {
    //       console.log(`No hay datos para la región: ${regionName}`);
    //       return;
    //     }

    //     const generoData = preparePieData(filtered, 'genero');
    //     const tipoData = prepareBarData(filtered, 'tipo_empresa');
    //     const cadenaData = preparePieData(filtered, 'cadena_productiva');

    //     chart1.setOption(createPieChartOption('Género', regionName, generoData));
    //     chart2.setOption(createBarChartOption('Tipo de Empresa', regionName, tipoData));
    //     chart3.setOption(createPieChartOption('Cadena Productiva', regionName, cadenaData));

    //     chart1.resize();
    //     chart2.resize();
    //     chart3.resize();
    //   }).catch(err => console.error('Error CSV:', err));
    // }
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
  // Se ajusta el título en caso de "Género"
  const formattedTitle = title === 'Género' ? 'Género Persona\nEncuestada' : title;

  // Se calcula el total para mostrar porcentajes en el tooltip si se desea
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return {
    title: { text: `${formattedTitle}\n${formattedRegionName}`, left: 'left' },
    tooltip: { 
      trigger: 'item', 
      formatter: function(params) {
        const percent = ((params.value / total) * 100).toFixed(2);
        return `${params.name}: ${params.value} (${percent}%)`;
      }
    },
    series: [{
      type: 'pie',
      radius: ['30%', '70%'],
      center: ['50%', '50%'],
      data: data,
      label: {
        formatter: '{b}:\n{d}%',
        fontSize: 12,            // Tamaño de fuente mayor
        backgroundColor: '#cbd2d3',   // Fondo blanco para la etiqueta
        //borderColor: '#333',       // Borde gris oscuro
        borderWidth: 1,            // Ancho del borde
        borderRadius: 4,           // Bordes redondeados
        padding: [5, 10]           // Espaciado interno (vertical, horizontal)
      },

      itemStyle: { borderRadius: 5 },
      emphasis: { disabled: true }
    }]
  };
}

// Función para crear la configuración del gráfico de barras con porcentajes
function createBarChartOption(title, regionName, data) {
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
    title: { text: title, left: "center" },
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
    

    // Debounce function for resize events
    function debounce(func, wait = 100) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    function handleResize() {
      try {
          // Resize all registered chart instances
          Object.values(chartInstances).forEach(chart => {
              if (chart && typeof chart.resize === 'function') {
                  chart.resize();
              }
          });
  
          // Resize mapa y gráficos principales
          if (chart) chart.resize();
  
          // Si el cambio en la ventana es significativo, regenerar los gráficos
          const currentWidth = window.innerWidth;
          if (Math.abs(currentWidth - lastWindowWidth) > 100) {
              lastWindowWidth = currentWidth;
  
              updateChart("selectorGeneralesInteres", "selectorTecnoAnalisis", "chartContainer", "Características Generales");
              updateChart("selector2b", "selector1b", "chartContainer2", "Características Tecnocreativas");
  
              // Regenerar gráficos chart1, chart2 y chart3
              renderCharts(currentRegion || 'nacional'); // Usar la última región seleccionada
          }
      } catch (error) {
          console.error('Error durante el resize:', error);
      }
  }
  
  // Actualizar el evento resize para incluir la regeneración de gráficos
  window.addEventListener('resize', debounce(handleResize));
  

    // Initialize resize handling
    let lastWindowWidth = window.innerWidth;
    const debouncedResize = debounce(handleResize);
    window.addEventListener('resize', debouncedResize);

    document.getElementById('resetButton').addEventListener('click', resetMap);
  });
  

    // // 5. Ajustamos tamaño dinámicamente al cambiar la ventana
    // // Initialize all chart instances
    // chartInstances['chart1'] = chart1;
    // chartInstances['chart2'] = chart2;
    // chartInstances['chart3'] = chart3;
    // chartInstances['map'] = chart;