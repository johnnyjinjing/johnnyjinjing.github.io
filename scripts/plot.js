var today = '2020-07-30';
var data = [];
var states = [];
var defaultStates = new Set(['California', 'New York', 'Illinois', 'Washington']);
var dateStringSet = new Set();
var color = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
var data1, data2 = [];

window.onload = function() {
  // read 1st data file
  d3.csv('/data/covid19-us-states.csv', d => {
    dateStringSet.add(d.date);
    return {
      dateString: d.date,
      date: d3.timeParse('%Y-%m-%d')(d.date),
      state: d.state,
      cases: +d.cases,
      deaths: +d.deaths
    };
  }).then(d1 => {
    // read 2nd data file
    d3.csv('/data/nst-est2019-alldata.csv', d => {
      if (d.division != 0) {
        return {
          state: d.NAME,
          region: d.REGION == 'X' ? 4 : +d.REGION - 1,
          estimate: d.POPESTIMATE2019 == '' ? false : true,
          population: d.POPESTIMATE2019 == '' ? +d.CENSUS2010POP : +d.POPESTIMATE2019
        };
      }
    }).then(d2 => {
      // join data files
      var statesSet = new Set()
      d1.forEach(el1 => {
        d2.forEach(el2 => {
          if (el1.state != el2.state) return;
          data.push(Object.assign({}, el1, el2));
          statesSet.add(el1.state);
        });
      });
      states = Array.from(statesSet);

      data1 = data.filter(el => el.dateString == today);

      states.forEach(state => {
        var tmp = data.filter(d => d.state == state);

        var tmp2 = [];
        // add missing data
        var existDateSet = new Set(tmp.map(el => el.dateString));

        dateStringSet.forEach(el => {
          if (!existDateSet.has(el)) {
            tmp2.push({
              dateString: el,
              date: d3.timeParse('%Y-%m-%d')(el),
              state: state,
              cases: 0,
              deaths: 0,
              region: tmp[0].region,
              estimate: tmp[0].estimate,
              population: tmp[0].population
            });
          }
        });

        data2.push({
          state: state,
          values: tmp2.length > 0 ? tmp2.concat(tmp) : tmp
        });
      });

      plotScene1();
    });
  });
};

function plotScene1() {
  document.getElementsByClassName('pagination')[0].getElementsByClassName('active')[0].removeAttribute('class');
  document.getElementById('pagination-1').setAttribute('class', 'active');
  document.getElementById('viz-title').innerHTML = 'Cases vs. Deaths by State (as of July 30)';
  document.getElementById('viz-description').innerHTML = 'This chart shows the total cases and deaths by <b>state</b> as of July 30. Each state is represented by a circle. States are grouped into geographical <b>regions</b> and marked in different colors and can be used as a <b>filter</b>. The size the circle indicates the <b>population</b> of the state. The dashed lines mark different <b>fatality rate</b>. Mouseover a circle shows the actual number of cases and deaths of the state.';

  var width = 500, height = 300, padding = 50;

  // svg
  d3.selectAll('svg > *').remove();
  Array.from(document.getElementsByClassName('tooltip')).forEach(el => el.remove());

  var svg = d3.select('#chart')
    .append('g')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(50, 50)')

  var xs = d3.scaleLog().domain([1, d3.max(data1, d => d.cases)]).range([0, width]);
  var ys = d3.scaleLog().domain([1, d3.max(data1, d => d.deaths)]).range([height, 0]);
  var rs = d3.scaleLog().domain([d3.min(data1, d => d.population), d3.max(data1, d => d.population)]).range([3, 8]);

  // tooltip
  var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // fatality rate line
  var line = d3.line()
    .x(d => xs(d.x))
    .y(d => ys(d.y));

  svg.append('g')
    .selectAll('path')
    .data([{
      name: 'l1',
      values: [{ x: 100, y: 8 }, { x: 500000, y: 40000 }]
    },
    {
      name: 'l2',
      values: [{ x: 100, y: 4 }, { x: 500000, y: 20000 }]
    },
    {
      name: 'l3',
      values: [{ x: 100, y: 1 }, { x: 500000, y: 5000 }]
    }
    ])
    .enter()
    .append('path')
    .attr('class', 'line')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .style('stroke-dasharray', '5,5')
    .style('opacity', 1)
    .attr('d', d => line(d.values));


  // main plot
  svg.append('g')
    .selectAll('circle')
    .data(data1)
    .enter()
    .append('circle')
    .attr('cx', d => xs(d.cases))
    .attr('cy', d => ys(d.deaths))
    .attr('r', d => rs(d.population))
    .attr('fill', d => color[d.region])
    .on('mouseover', d => {
      var toolTipHtml = '<b>' + d.state + '</b>' + '<br>' +
        'Cases: ' + d.cases + '<br>' +
        'Deaths: ' + d.deaths
      tooltip.transition()
        .duration(200)
        .style('opacity', .9);
      tooltip.html(toolTipHtml)
        .style('left', (d3.event.pageX + 20) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });


  // fatality rate annotation
  var annotation = svg.append('g');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '16px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(130, 220)')
    .text('Fatality Rate');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '14px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(160, 240) ')
    .text('8%');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '14px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(160, 260)')
    .text('4%');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '14px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(160, 300)')
    .text('1%');

  // axes
  svg.append('g')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(d3.axisBottom(xs)
      .tickValues([1, 10, 100, 1000, 10000, 100000])
      .tickFormat(d3.format('~s'))
    );

  svg.append('g')
    .call(d3.axisLeft(ys)
      .tickValues([1, 10, 100, 1000, 10000])
      .tickFormat(d3.format('~s'))
    );

  // axes label
  var axisLabel = svg.append('g');

  axisLabel.append('text')
    .style('fill', 'black')
    .style('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(' + width / 2 + ', ' + (height + 40) + ')')
    .text('Cases');

  axisLabel.append('text')
    .style('fill', 'black')
    .style('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(' + -35 + ', ' + (height / 2) + ') rotate(-90)')
    .text('Deaths');

  // legend for region
  var legend1 = svg.append('g');
  var legendText1 = ['Northeast', 'Midwest', 'South', 'West', 'Territory'];

  legend1.selectAll('circle')
    .data(legendText1)
    .enter()
    .append('circle')
    .attr('cx', 550)
    .attr('cy', (d, i) => 30 + i * 20)
    .attr('r', 5)
    .attr('class', 'legend-region')
    .style('fill', (d, i) => color[i])
    .on('mouseover', (d, i) => {
      d3.selectAll('circle')
        .data(data1)
        .filter(d2 => d2.region != i)
        .style('opacity', 0.2);
      d3.selectAll('.legend-region')
        .data(legendText1)
        .filter((d2, i2) => i2 != i)
        .style('opacity', 0.2);
      d3.selectAll('.legend-region-text')
        .data(legendText1)
        .filter((d2, i2) => i2 != i)
        .style('opacity', 0.2);
    }
    ).on('mouseout', () => {
      d3.selectAll('circle')
        .data(data1)
        .style('opacity', 1);
      d3.selectAll('.legend-region')
        .style('opacity', 1);
      d3.selectAll('.legend-region-text')
        .style('opacity', 1);
    });

  legend1.selectAll('text')
    .data(legendText1)
    .enter()
    .append('text')
    .attr('x', 570)
    .attr('y', (d, i) => 30 + i * 20)
    .attr('class', 'legend-region-text')
    .attr('text-anchor', 'left')
    .style('fill', 'black')
    .style('font-size', '16px')
    .style('alignment-baseline', 'middle')
    .text(d => d)

  legend1.append('text')
    .attr('x', 540)
    .attr('y', 5)
    .text('Region (filter)').style('font-size', '15px').attr('alignment-baseline', 'middle')

  // legend for population
  var legend2 = svg.append('g');
  var legendText2 = [
    { text: '100K', value: 100000 },
    { text: '1M', value: 1000000 },
    { text: '10M', value: 10000000 }
  ]

  legend2.selectAll('circle')
    .data(legendText2)
    .enter()
    .append('circle')
    .attr('cx', 550)
    .attr('cy', (d, i) => 200 + i * 20)
    .attr('r', (d, i) => rs(d.value))
    .attr('class', 'legend-population')
    .style('fill', 'white');

  legend2.selectAll('text')
    .data(legendText2)
    .enter()
    .append('text')
    .attr('x', 570)
    .attr('y', (d, i) => 200 + i * 20)
    .attr('text-anchor', 'left')
    .style('fill', 'black')
    .style('font-size', '16px')
    .style('alignment-baseline', 'middle')
    .text(d => d.text)

  legend2.append('text')
    .attr('x', 540)
    .attr('y', 180)
    .text('Population').style('font-size', '15px').attr('alignment-baseline', 'middle')

  // annotation for circle

  annotation = svg.append('g');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(500, -10)')
    .attr('font-weight', 600)
    .text('NY');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(510, 28)')
    .attr('font-weight', 600)
    .text('CA');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(510, 60)')
    .attr('font-weight', 600)
    .text('FL');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(485, 38)')
    .attr('font-weight', 600)
    .text('TX');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '10px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(450, 15)')
    .attr('font-weight', 600)
    .text('NJ');
}

function plotScene2() {
  plotTimeSeries('cases');

  document.getElementById('pagination-2').setAttribute('class', 'active');

  // annotation
  var svg = d3.select('#chart g');

  addArrow(svg);

  var annotation = svg.append('g');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '12px')
    .attr('text-anchor', 'left')
    .attr('transform', 'translate(60, 70)')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('Outbreak in New York')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('and surrounding states')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('in March');

  annotation.append("line")
    .attr("x1", 110)
    .attr("y1", 110)
    .attr("x2", 150)
    .attr("y2", 150)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("marker-end", "url(#triangle)");

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '12px')
    .attr('text-anchor', 'left')
    .attr('transform', 'translate(290, -25)')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('California surpassed New York')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('in total cases on July 22');

  annotation.append("line")
    .attr("x1", 440)
    .attr("y1", -10)
    .attr("x2", 470)
    .attr("y2", 0)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("marker-end", "url(#triangle)");
}

function plotScene3() {
  plotTimeSeries('deaths');

  document.getElementById('pagination-3').setAttribute('class', 'active');

  // annotation
  var svg = d3.select('#chart g');

  addArrow(svg);

  var annotation = svg.append('g');

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '12px')
    .attr('text-anchor', 'left')
    .attr('transform', 'translate(60, 10)')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('Total deaths in New York')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('reached 10,000 on Apr 10');

  annotation.append("line")
    .attr("x1", 120)
    .attr("y1", 40)
    .attr("x2", 200)
    .attr("y2", 54)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("marker-end", "url(#triangle)");

  annotation.append('text')
    .style('fill', 'black')
    .style('font-size', '12px')
    .attr('text-anchor', 'left')
    .attr('transform', 'translate(20, 300)')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('Washintgon had the most')
    .append('tspan')
    .attr('x', 0)
    .attr('dy', 12)
    .text('deaths in early March');

  annotation.append("line")
    .attr("x1", 70)
    .attr("y1", 330)
    .attr("x2", 110)
    .attr("y2", 360)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("marker-end", "url(#triangle)");
}

function plotTimeSeries(value) {
  document.getElementsByClassName('pagination')[0].getElementsByClassName('active')[0].removeAttribute('class');
  document.getElementById('viz-title').innerHTML = 'Cumulative ' + (value.charAt(0).toUpperCase() + value.slice(1)) + ' by State';
  document.getElementById('viz-description').innerHTML = 'This chart shows the cumulative ' + value + ' by <b>state</b> over time. Each state is represented by a line. States are grouped into geographical <b>regions</b> and marked in different colors and can be used as a <b>filter</b>. There are four states\' data highlighted by default: New York, California, Illinois and Washington. Mouseover a line hightlights the line and shows the actual number of ' + value + ' of the date. <b>Annotations</b> are added to help understand the data.';

  var width = 500, height = 500, padding = 50;

  // svg
  d3.selectAll('svg > *').remove();
  Array.from(document.getElementsByClassName('tooltip')).forEach(el => el.remove());

  var svg = d3.select('#chart')
    .append('g')
    .attr('width', width)
    .attr('height', height)
    .attr('transform', 'translate(50, 50)');

  var xs = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  var ys = d3.scaleSymlog()
    .domain([0, d3.max(data, d => +d[value])])
    .range([height, 0]);

  // tooltip
  var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  // line
  var line = d3.line()
    .x(d => xs(d.date))
    .y(d => ys(d[value]));

  var highlightedOpacity = 1;
  var normalOpacity = 0.3;
  var highlightedStrokeWidth = 4;
  var normalStrokeWidth = 0.5;
  var highlightedFontWeight = 800;
  var normalFontWeight = 400;
  var highlightedTextOpacity = 1;
  var normalTextOpacity = 0.2;

  // line
  svg.append('g')
    .selectAll('path')
    .data(data2)
    .enter()
    .append('path')
    .attr('class', 'line')
    .attr('fill', 'none')
    .attr('stroke', d => color[d.values[0].region])
    .attr('stroke-width', d => defaultStates.has(d.values[0].state) ? highlightedStrokeWidth : normalStrokeWidth)
    .style('opacity', d => defaultStates.has(d.values[0].state) ? highlightedOpacity : normalOpacity)
    .on('mouseover', function(d) {
      var mouse = d3.mouse(this);
      var x = xs.invert(mouse[0]);
      var n = d3.bisectLeft(d.values.map(e => e.date), x, 1);
      var dateString = d.values[n].dateString;
      var val = d.values[n][value];

      var toolTipHtml = '<b>' + d.state + '</b>' + '<br>' +
        'Date: ' + dateString + '<br>' +
        value.charAt(0).toUpperCase() + value.slice(1) + ': ' + val
      tooltip.transition()
        .duration(200)
        .style('opacity', .8);
      tooltip.html(toolTipHtml)
        .style('left', (d3.event.pageX - 150) + 'px')
        .style('top', (d3.event.pageY - 28) + 'px');

      d3.select(this)
        .style('opacity', highlightedOpacity)
        .attr('stroke-width', highlightedStrokeWidth)
      d3.selectAll('.legend-state')
        .filter(d2 => d2.state == d.state)
        .style('opacity', highlightedTextOpacity)
        .attr('font-weight', highlightedFontWeight);
    })
    .on('mouseout', () => {
      d3.selectAll('.line')
        .style('opacity', d2 => defaultStates.has(d2.values[0].state) ? highlightedOpacity : normalOpacity)
        .attr('stroke-width', d2 => defaultStates.has(d2.values[0].state) ? highlightedStrokeWidth : normalStrokeWidth)
      d3.selectAll('.legend-state')
        .style('opacity', d2 => defaultStates.has(d2.values[0].state) ? highlightedTextOpacity : normalTextOpacity)
        .attr('font-weight', d2 => defaultStates.has(d2.values[0].state) ? highlightedFontWeight : normalFontWeight)
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    })
    .attr('d', d => line(d.values));

  // text
  svg.append('g')
    .selectAll('text')
    .data(data2)
    .enter()
    .append('text')
    .attr('x', 520)
    .attr('y', d => ys(d.values[d.values.length - 1][value]))
    .attr('font-weight', d => defaultStates.has(d.values[0].state) ? highlightedFontWeight : normalFontWeight)
    .attr('class', 'legend-state')
    .style('fill', d => color[d.values[0].region])
    .style('opacity', d => defaultStates.has(d.values[0].state) ? highlightedTextOpacity : normalTextOpacity)
    .text(d => d.values[0].state).style('font-size', '10px').attr('alignment-baseline', 'middle');

  // axes
  svg.append('g')
    .attr('transform', 'translate(0, ' + height + ')')
    .call(d3.axisBottom(xs)
      .ticks(10)
    );

  svg.append('g')
    .call(d3.axisLeft(ys)
      .tickValues([1, 10, 100, 1000, 10000, 100000])
      .tickFormat(d3.format('~s'))
    );

  // axes label
  var axisLabel = svg.append('g');

  axisLabel.append('text')
    .style('fill', 'black')
    .style('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(' + width / 2 + ', ' + (height + 40) + ')')
    .text('Date');

  axisLabel.append('text')
    .style('fill', 'black')
    .style('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('transform', 'translate(' + -35 + ', ' + (height / 2) + ') rotate(-90)')
    .text(value.charAt(0).toUpperCase() + value.slice(1));

  // legend for region
  var legend = svg.append('g');
  var legendText = ['Northeast', 'Midwest', 'South', 'West', 'Territory'];

  legend.selectAll('circle')
    .data(legendText)
    .enter()
    .append('circle')
    .attr('cx', 650)
    .attr('cy', (d, i) => 30 + i * 20)
    .attr('r', 5)
    .attr('class', 'legend-region')
    .style('fill', (d, i) => color[i])
    .on('mouseover', (d, i) => {
      d3.selectAll('.line')
        .data(data2)
        .filter(d2 => d2.values[0].region == i)
        .style('opacity', highlightedOpacity)
        .attr('stroke-width', highlightedStrokeWidth);
      d3.selectAll('.line')
        .data(data2)
        .filter(d2 => d2.values[0].region != i)
        .style('opacity', normalOpacity)
        .attr('stroke-width', normalStrokeWidth);
      d3.selectAll('.line')
        .data(data2)
        .filter(d2 => d2.values[0].region == i)
        .style('opacity', highlightedOpacity)
        .attr('stroke-width', highlightedStrokeWidth);
      d3.selectAll('.legend-state')
        .data(data2)
        .filter(d2 => d2.values[0].region == i)
        .style('opacity', highlightedTextOpacity)
        .attr('font-weight', highlightedFontWeight);
      d3.selectAll('.legend-state')
        .data(data2)
        .filter(d2 => d2.values[0].region != i)
        .style('opacity', normalTextOpacity)
        .attr('font-weight', normalFontWeight);
      d3.selectAll('.legend-region')
        .data(legendText)
        .filter((d2, i2) => i2 != i)
        .style('opacity', 0.2);
      d3.selectAll('.legend-region-text')
        .data(legendText)
        .filter((d2, i2) => i2 != i)
        .style('opacity', 0.2);
    }
    ).on('mouseout', () => {
      d3.selectAll('.line')
        .style('opacity', d2 => defaultStates.has(d2.values[0].state) ? highlightedOpacity : normalOpacity)
        .attr('stroke-width', d2 => defaultStates.has(d2.values[0].state) ? highlightedStrokeWidth : normalStrokeWidth)
      d3.selectAll('.legend-state')
        .style('opacity', d2 => defaultStates.has(d2.values[0].state) ? highlightedTextOpacity : normalTextOpacity)
        .attr('font-weight', d2 => defaultStates.has(d2.values[0].state) ? highlightedFontWeight : normalFontWeight)
      d3.selectAll('.legend-region')
        .style('opacity', 1);
      d3.selectAll('.legend-region-text')
        .style('opacity', 1);
    });

  legend.selectAll('text')
    .data(legendText)
    .enter()
    .append('text')
    .attr('x', 670)
    .attr('y', (d, i) => 30 + i * 20)
    .attr('class', 'legend-region-text')
    .attr('text-anchor', 'left')
    .style('fill', 'black')
    .style('font-size', '16px')
    .style('alignment-baseline', 'middle')
    .text(d => d)

  legend.append('text')
    .attr('x', 640)
    .attr('y', 5)
    .text('Region (filter)').style('font-size', '15px').attr('alignment-baseline', 'middle')
}

function addArrow(svg) {
  svg.append("svg:defs").append("svg:marker")
    .attr("id", "triangle")
    .attr("refX", 6)
    .attr("refY", 6)
    .attr("markerWidth", 30)
    .attr("markerHeight", 30)
    .attr("markerUnits", "userSpaceOnUse")
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 12 6 0 12 3 6")
    .style("fill", "black");
}