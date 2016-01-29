var records_loc = window.location.pathname.split('/').concat('records').join('/');
var records_canvas = document.getElementById('records-canvas');
var canvas_width = records_canvas.width;
var canvas_height = records_canvas.height;
var mouse_position_element = document.getElementById('mouse-position');

minmax = function(iterable, key) {
  var min = iterable.reduce(function(a, b) {
    return a[key] < b[key] ? a : b;
  });
  var max = iterable.reduce(function(a, b) {
    return a[key] > b[key] ? a : b;
  });
  return {
    min: min[key],
    max: max[key]
  };
};

var localdata = {};

general.makeRequest(records_loc, 'GET', null).then(function(result) {
  var records = JSON.parse(result.response);
  localdata.records = records;

  var props = calculateDataProps(records, [{
    varname: 'datetime',
    max: new Date().getTime() / 1000
  }, {
    varname: 'signal_strength'
  }]);
  localdata.props = props;

  recalculateCanvas();

}, function(error) {
  console.log(error);
});

canvasMouseoverListener = function(e) {
  var text = "";
  var rect = records_canvas.getBoundingClientRect();
  var xpos = e.clientX - rect.left,
      ypos = e.clientY - rect.top;

  var props = localdata.props;
  var percent = xpos / canvas_width;
  var utcSeconds = props.datetime.min + (props.datetime.max - props.datetime.min) * percent;
  var d = new Date(0);
  d.setUTCSeconds(utcSeconds);

  clearCanvas();
  drawLine(percent);
  drawData();

  //text += 'x: ' + xpos + ', y: ' + ypos;
  
  mouse_position_element.textContent = String(d);
};

var lastListener = null;

var clearCanvas = function() {
  var ctx = records_canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas_width, canvas_height);
};

var drawLine = function(percent_x) {
  var ctx = records_canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(percent_x*canvas_width, 0);
  ctx.lineTo(percent_x*canvas_width, canvas_height);
  ctx.stroke();
};

var drawData = function() {
  var records = localdata.records;
  if (records.length < 1) {
    console.log("no records for this time period");
    return;
  }

  var ctx = records_canvas.getContext('2d');

  var props = localdata.props;
  var records_props = props.datetime;
  var signal_props = props.signal_strength;

  var bins = [];

  var padding = 10;

  ctx.save();
  ctx.scale(1.0, (canvas_height - 2*padding)/canvas_height);
  ctx.translate(0, padding);
  ctx.beginPath();
  ctx.lineTo(0, canvas_height);

  var reset = false;
  test = [];
  for(var i=0; i < records.length; i++) {
    var record = records[i];
    var py = (record.signal_strength - signal_props.min)/(signal_props.max - signal_props.min);
    var px = (record.datetime - records_props.min)/(records_props.max - records_props.min);
    test.push([px, py]);
    if (reset) {
      ctx.moveTo(px*canvas_width, canvas_height);
      ctx.lineTo(px*canvas_width, (1-py)*canvas_height);
      reset = false;
    } else {
      ctx.lineTo(px*canvas_width, (1-py)*canvas_height);
    }
    if (i < records.length-1 && records[i+1].datetime > record.datetime + 120) {
      ctx.stroke();
      ctx.lineTo(px*canvas_width, canvas_height);
      ctx.closePath();
      ctx.fillStyle = "grey";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.beginPath();
      reset = true;
    } else if (i == records.length) {
      ctx.stroke();
    }
  }
  ctx.restore();
};

var recalculateCanvas = function() {
  var _parent = records_canvas.parentElement;
  //option1
  //var dimensions = _parent.getBoundingClientRect();
  //var width = dimensions.width;
  
  //option2
  //var style = window.getComputedStyle(_parent, null);
  //var width = style.getPropertyValue("width").split('px')[0];
  
  var width = _parent.clientWidth - 30;
  var height = 120; // dimensions.height;

  records_canvas.width = width;
  records_canvas.height = height;

  // update globals
  canvas_width = width;
  canvas_height = height;

  drawData();

  records_canvas.removeEventListener('mousemove', canvasMouseoverListener);
  records_canvas.addEventListener('mousemove', canvasMouseoverListener);
};

var calculateDataProps = function (data, settings) {
  var out = {};
  for(var i=0; i<settings.length; i++) {
    var elem = settings[i];
    var vals = minmax(data, elem.varname);
    if (elem.hasOwnProperty('max')) {
      vals.max = elem.max;
    } else if (elem.hasOwnProperty('max')) {
      vals.min = elem.min;
    }
    out[elem.varname] = vals;
  }
  return out;
};

window.addEventListener('resize', function(e) {
  recalculateCanvas();
});
