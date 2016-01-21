var records_loc = window.location.pathname.split('/').concat('records').join('/');
var records_canvas = document.getElementById('records-canvas');

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

makeRequest(records_loc, 'GET', null).then(function(result) {
  var records = JSON.parse(result.response);
  localdata.records = records;
  recalculateCanvas();

}, function(error) {
  console.log(error);
});

canvasMouseoverListener = function(e) {
  var rect = records_canvas.getBoundingClientRect();
  var xpos = e.clientX - rect.left,
      ypos = e.clientY - rect.top;

  console.log(xpos, ypos);
};

var lastListener = null;

recalculateCanvas = function() {
  var _parent = records_canvas.parentElement;
  //option1
  //var dimensions = _parent.getBoundingClientRect();
  //var width = dimensions.width;
  
  //option2
  //var style = window.getComputedStyle(_parent, null);
  //var width = style.getPropertyValue("width").split('px')[0];
  
  var width = _parent.clientWidth - 30;
  console.log(width);
  var height = 100; // dimensions.height;
  records_canvas.width = width;
  records_canvas.height = height;

  var records = localdata.records;
  if (records.length < 1) {
    console.log("no records for this time period");
    return;
  }

  var ctx = records_canvas.getContext('2d');

  var records_props = minmax(records, 'datetime');
  var signal_props = minmax(records, 'signal_strength');
  records_props.max = new Date().getTime() / 1000;
  var bins = [];

  ctx.beginPath();
  ctx.lineTo(0, height);
  var reset = false;
  test = [];
  for(var i=0; i < records.length; i++) {
    var record = records[i];
    var py = (record.signal_strength - signal_props.min)/(signal_props.max - signal_props.min);
    var px = (record.datetime - records_props.min)/(records_props.max - records_props.min);
    test.push([px, py]);
    if (reset) {
      ctx.moveTo(px*width, height);
      ctx.lineTo(px*width, (1-py)*height);
      reset = false;
    } else {
      ctx.lineTo(px*width, (1-py)*height);
    }
    if (i < records.length-1 && records[i+1].datetime > record.datetime + 120) {
      ctx.stroke();
      ctx.lineTo(px*width, height);
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
  records_canvas.removeEventListener('mousemove', canvasMouseoverListener);
  records_canvas.addEventListener('mousemove', canvasMouseoverListener);
};

window.addEventListener('resize', function(e) {
  recalculateCanvas();
});
