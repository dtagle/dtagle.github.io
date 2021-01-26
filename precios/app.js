// I. Configuración
graf = d3.select('#graf')

ancho_total = graf.style('width').slice(0, -2)
alto_total = ancho_total * 9 / 16

graf.style('width', `${ ancho_total }px`)
    .style('height', `${ alto_total }px`)

margins = { top: 30, left: 50, right: 15, bottom: 120 }

ancho = ancho_total - margins.left - margins.right
alto  = alto_total - margins.top - margins.bottom

// II. Variables globales
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`)

g = svg.append('g')
        .attr('transform', `translate(${ margins.left }, ${ margins.top })`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

y = d3.scaleLinear()
          .range([alto, 0])

x = d3.scaleBand()
      .range([0, ancho])
      .paddingInner(0.1)
      .paddingOuter(0.3)

color = d3.scaleOrdinal()
          // .range(['red', 'green', 'blue', 'yellow'])
          // https://bl.ocks.org/pstuffa/3393ff2711a53975040077b7453781a9
          .range(d3.schemeCategory20b)

xAxisGroup = g.append('g')
              .attr('transform', `translate(0, ${ alto })`)
              .attr('class', 'eje')
yAxisGroup = g.append('g')
              .attr('class', 'eje')

titulo = g.append('text')
          .attr('x', `${ancho / 2}px`)
          .attr('y', '-5px')
          .attr('text-anchor', 'middle')
          .text('Indicadores del Indice Nacional de Precios al Consumidor')
          .attr('class', 'titulo-grafica')

dataArray = []

// (1) Variables globales para determinar que mostrar y
//     poder obtener los datos del select
ap = 'Subyacente'
apSelect = d3.select('#ap')

metrica = 'indice'
metricaSelect = d3.select('#metrica')

ascendente = false

// III. render (update o dibujo)
function render(data) {
  // function(d, i) { return d }
  // (d, i) => d
  bars = g.selectAll('rect')
            .data(data, d => d.estado)

  bars.enter()
      .append('rect')
        .style('width', '0px')
        .style('height', '0px')
        .style('y', `${y(0)}px`)
        .style('fill', '#000')
        .style('x', d => x(d.estado) + 'px')
      .merge(bars)
        .transition()
        // https://bl.ocks.org/d3noob/1ea51d03775b9650e8dfd03474e202fe
        // .ease(d3.easeElastic)
        .duration(2000)
          .style('x', d => x(d.estado) + 'px')
          .style('y', d => (y(d[metrica])) + 'px')
          .style('height', d => (alto - y(d[metrica])) + 'px')
          .style('fill', d => color(d.ap))
          .style('width', d => `${x.bandwidth()}px`)

  bars.exit()
      .transition()
      .duration(2000)
        .style('height', '0px')
        .style('y', d => `${y(0)}px`)
        .style('fill', '#000000')
      .remove()


  yAxisCall = d3.axisLeft(y)
                .ticks(3)
                .tickFormat(d => d + ((metrica == 'indice') ? 'm.' : ''))
  yAxisGroup.transition()
            .duration(2000)
            .call(yAxisCall)

  xAxisCall = d3.axisBottom(x)
  xAxisGroup.transition()
            .duration(2000)
            .call(xAxisCall)
            .selectAll('text')
            .attr('x', '-8px')
            .attr('y', '-5px')
            .attr('text-anchor', 'end')
            .attr('transform', 'rotate(-90)')
}

// IV. Carga de datos
d3.csv('indices.csv')
.then(function(data) {
  data.forEach(d => {
    d.indice = +d.indice
    d.variacion= +d.variacion
    d.variacion_anual = +d.variacion_anual
    d.peso_100 = +d.peso_100
  })

  dataArray = data

  color.domain(data.map(d => d.ap))

  // <select>
  //   <option value="x">despliega</option>
  // </select>
  apSelect.append('option')
              .attr('value', 'Subyacente')
              .text('Subyacente')
  color.domain().forEach(d => {
    console.log(d)
    apSelect.append('option')
                .attr('value', d)
                .text(d)
  })

  // V. Despliegue
  frame()
})
.catch(e => {
  console.log('No se tuvo acceso al archivo ' + e.message)
})

function frame() {
  dataframe = dataArray
  if (ap != 'Subyacente') {
    dataframe = d3.filter(dataArray, d => d.ap == ap)
  }

  dataframe.sort((a, b) => {
    return ascendente ? d3.ascending(a[metrica], b[metrica]) : d3.descending(a[metrica], b[metrica])
    //
    // Es equivalente a...
    //
    // return ascendente ? a[metrica] - b[metrica] : b[metrica] - a[metrica]
  })

  // Calcular el mayor índice en
  // los datos (columna "indice")
  maxy = d3.max(dataframe, d => d[metrica])
  // Creamos una función para calcular el indice
  // de las barras y que quepan en nuestro canvas
  y.domain([0, maxy])
  x.domain(dataframe.map(d => d.estado))

  render(dataframe)
}

apSelect.on('change', () => {
  ap = apSelect.node().value
  frame()
})

metricaSelect.on('change', () => {
  metrica = metricaSelect.node().value
  frame()
})

function cambiaOrden() {
  ascendente = !ascendente
  frame()
}
