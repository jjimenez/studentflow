var rewound = {};
var schedules = {};
var albersProjection;
var geoPath;
var zoom;
var svg;
var g;
var cradius = 1;
var cpadding = 2;
var circles;
var simulation;
var current_hour = 8;
var current_dow = 'mwf';
var animate = 1;

var max_hour = 18;

function initMap() {
  var width = 700,
      height = 580;

  albersProjection = d3.geoAlbers()
    .scale(1229500)
    .rotate([91.5356997, 0])
    .center([0, 41.661872])
    .translate([width / 2, height / 2]);

  geoPath = d3.geoPath()
    .projection(albersProjection);
  zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', zoomed);

  svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(zoom);

  g = svg.append('g');

  g.selectAll('path')
    .data(rewound.features)
    .enter()
    .append('path')
    .attr('fill', '#ccc')
    .attr('d', geoPath);

  simulation = d3.forceSimulation()
    .velocityDecay(1.0)
    .force("y", d3.forceY().strength(.1))
    .force("x", d3.forceX().strength(.1))
    .force('charge', d3.forceManyBody().strength(-150))
    .alphaTarget(.05)
    .on('tick', ticked);

  circles = g
    .selectAll("circle");


}

function ticked() {
  circles
    .attr("cx", function(d) {
      return d.x;
    })
  .attr("cy", function(d) {
    return d.y;
  });
}

function clustering(alpha) {
  schedules.students.forEach(function(d) {
    var projection = get_projection(d);
    if (projection) {
      var x = d.x - projection[0],
  y = d.y - projection[1],
  l = Math.sqrt(x * x + y * y),
  r = cradius + 1;
  if (l !== r) {
    l = (l - r) / l * alpha;
    d.x -= x *= l;
    d.y -= y *= l;
  }
    }
  });
}

function collide(alpha) {
  var quadtree = d3.quadtree()
    .x((d) => d.x)
    .y((d) => d.y)
    .addAll(schedules.students);

  schedules.students.forEach(function(d) {
    var r = cradius + cpadding,
    nx1 = d.x - r,
    nx2 = d.x + r,
    ny1 = d.y - r,
    ny2 = d.y + r;
  quadtree.visit(function(quad, x1, y1, x2, y2) {

    if (quad.data && (quad.data !== d)) {
      var x = d.x - quad.data.x,
    y = d.y - quad.data.y,
    l = Math.sqrt(x * x + y * y),
    r = cradius + cradius + cpadding;
  if (l < r) {
    l = (l - r) / l * alpha;
    d.x -= x *= l;
    d.y -= y *= l;
    quad.data.x += x;
    quad.data.y += y;
  }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  });
  });
}

function zoomed() {
  g.attr('transform', d3.event.transform);
}


function get_projection(student) {
  courses = student.classes;
  course = courses.find(function(d) {
    return d.dow == current_dow && d.start_time == current_hour
  });
  if (course) {
    course_location = course.building.location;
    js_geo = [course_location[1], course_location[0]];
    projection = albersProjection(js_geo);
  } else {
    projection = [10, 10];
  }
  return projection;
}

function placeStudents() {
  circles = circles
    .datum(schedules.students)
    .data(schedules.students, function(d) {
      return d ? d.student_id : this.student_id;
    })
  .enter().append("circle")
    .attr('class', 'nodes')
    .attr("id", function(d) {
      return d.student_id;
    })
  .attr("r", function(d) {
    return cradius;
  })
  .attr('cx', function(d) {
    projection = get_projection(d);
    return projection[0];
  })
  .attr('cy', function(d) {
    projection = get_projection(d);
    return projection[1];
  });

  simulation.nodes(schedules.students)
    .force("collide", collide)
    .force("cluster", clustering);

}



d3.queue()
  .defer(d3.json, 'data/rewound.json')
  .defer(d3.json, 'data/mock_schedules.json')
  .await(setup);

  function setup(error, input_buildings, input_schedules) {
    rewound = input_buildings;
    schedules = input_schedules;
    initMap();
    placeStudents();

    $('#dow_slider').on('change', function() {
      if (this.checked) {
        current_dow = 'tth';
      } else {
        current_dow = 'mwf';
      }
      $('#dow_label').text(current_dow);
    });

    $('#animation_slider').on('change', function() {
      if (this.checked) {
        animate = 1;
        $('#animation_label').text('Animation: ON');
      } else {
        animate = -1;
        $('#animation_label').text('Animation: OFF');
      }
    });

    var rangeSlider = function() {
      var slider = $('.range-slider'),
          range = $('.range-slider__range'),
          value = $('.range-slider__value');

      slider.each(function() {

        value.each(function() {
          var value = $(this).prev().attr('value');
          $(this).html(value);
        });

        range.on('input', function() {
          $(this).next(value).html(this.value);
        });
      });
    };

    rangeSlider();

    $('#hour_slider').on('change', function() {
      current_hour = parseInt($(this).val());
    });

    d3.interval(function() {
      if (animate == 1) {

        if (current_hour == max_hour) {
          //           console.log('wrapping at end of day');
          if (current_dow == 'mwf') {
            $('#dow_slider').prop('checked', true);
            current_dow = 'tth';
            $('#dow_label').text('tth');
          } else {
            $('#dow_slider').prop('checked', false);
            current_dow ='mwf';
            $('#dow_label').text('mwf');
          }
          current_hour = 8;
        } else {
          //         console.log('incrementing hour');
          current_hour = current_hour + 1;
        }
        $('#hour_slider').val(current_hour);
        $('#hour_slider_span').text(current_hour);
        //      console.log(current_dow + ':' + current_hour.toString());
      }
      //console.log('current_dow: ' + current_dow + ' current_hour: ' + current_hour.toString());
    }, 1500);
  }
