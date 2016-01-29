var data = localdata.compare;

var Group = function(member) {
  Group.members.push(this);
  return this;
};
Group.groups = [];

Group.prototype.getMax = function(property) {
  return Group.members.reduce(function(a, b) {
    return a[property] > b[property] ? a[property] : b[property];
  });
};

var Plot = function(plot_data, group, initialWidth) {
  var canvas_element = general.domElemWithProps('canvas', {});
  canvas_element.height = 100;
  this.canvas = canvas_element;
  this.data = plot_data;
  this.group = group;

  this.signalMax = general.max(plot_data, 'signal_strength');
  this.signalMin = general.min(plot_data, 'signal_strength');
  this.dateMin = general.min(plot_data, 'datetime');
  this.dateMax = general.max(plot_data, 'datetime');

  console.log(this.dateMin, this.dateMax, this.signalMin, this.signalMax);

  Plot.plots.push(this);

  this.recalculateCanvas(initialWidth || null);

  return canvas_element;
};

Plot.plots = [];

Plot.prototype.drawCanvas = function(xmin_override, xmax_override) {
  var ctx = this.canvas.getContext('2d');
  var cw = this.canvas.width,
      ch = this.canvas.height,
      dmax = xmax_override || this.dateMax,
      dmin = xmin_override || this.dateMin,
      smax = this.signalMax,
      smin = this.signalMin;

  ctx.beginPath();
  for(var i=0; i < this.data.length; i++) {
    var point = this.data[i];
    var ss = point.signal_strength;
    var dt = point.datetime;
    var xpos = (dt - dmin)/(dmax - dmin)*cw;
    var ypos = (1-(ss - smin)/(smax - smin))*ch;
    ctx.lineTo(xpos, ypos);
  }
  ctx.stroke();
  return;
};

Plot.prototype.recalculateCanvas = function(width) {
  if(width) {
    this.canvas.width = width;
  } else {
    this.canvas.width = this.canvas.parentNode.offsetWidth;
  }
  this.drawCanvas();

  return;
};

var canvas_container = document.getElementById('canvas-container');

var group = new Group();
for(var i=0; i < data.length; i++) {
  var dataSet = data[i];
  var plot_canvas = new Plot(dataSet, group, canvas_container.offsetWidth);
  canvas_container.appendChild(plot_canvas);
}

window.onresize = function() {
  Plot.plots.forEach(function(plot) {
    plot.recalculateCanvas();
  });
};
