"use strict";
var records_canvas = document.getElementById('records-canvas');

class RecordCanvas {
  constructor(canvas_element) {
    this.canvas = canvas_element;
  }
}

var test = new RecordCanvas(records_canvas);

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
}
