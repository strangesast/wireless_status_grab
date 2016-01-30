var data = localdata.compare;

var Group = function(initialWidth) {
  this.plots = [];
  this.xmin = Infinity;
  this.xmax = -Infinity;
  this.ymin = Infinity;
  this.ymax = -Infinity;
  Group.groups.push(this);
  return this;
};
Group.groups = [];

Group.prototype.add = function(plot) {
  group.xmin = group.xmin > plot.dateMin ? plot.dateMin : group.xmin;
  group.xmax = group.xmax < plot.dateMax ? plot.dateMax : group.xmax;
  group.ymin = group.ymin < plot.signalMin ? plot.signalMin : group.ymin;
  group.ymax = group.ymax < plot.signalMax ? plot.signalMax : group.ymax;
  this.plots.push(plot);
};

Group.prototype.initialize = function(parentElement) {
  this.parentElement = parentElement;
  this.plots.forEach(function(group) {
    return function(plot) {
      plot.recalculateCanvas(group.parentElement.offsetWidth, group.xmin, group.xmax);
      group.parentElement.appendChild(plot.canvas);
    };
  }(this));
};

Group.prototype.recalculateCanvas = function() {
  this.plots.forEach(function(group) {
    return function(plot) {
      plot.recalculateCanvas(group.parentElement.offsetWidth, group.xmin, group.xmax);
    };
  }(this));
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

  Plot.plots.push(this);

  return this;
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
  var reset = true;
  for(var i=0; i < this.data.length; i++) {
    var point = this.data[i];
    var ss = point.signal_strength;
    var dt = point.datetime;
    var xpos = (dt - dmin)/(dmax - dmin)*cw;
    var ypos = (1-(ss - smin)/(smax - smin))*ch;
    if(reset) {
      ctx.beginPath();
      ctx.moveTo(xpos, ypos);
      reset = false;
    } else {
      ctx.lineTo(xpos, ypos);
    }
    if(this.data[i+1 < this.data.length ? i+1 : i].datetime - dt > 120 || i == this.data.length - 1) {
      reset = true;
      ctx.stroke();
    }
  }
  return;
};

Plot.prototype.recalculateCanvas = function(width, newmin, newmax) {
  if(width) {
    this.canvas.width = width;
  } else {
    this.canvas.width = this.canvas.parentNode.offsetWidth;
  }
  this.drawCanvas(newmin, newmax);
  return;
};

var canvas_container = document.getElementById('canvas-container');

var group = new Group();
for(var i=0; i < data.length; i++) {
  var dataSet = data[i];
  group.add(new Plot(dataSet, group));
}
group.initialize(canvas_container);

var resizeWaiting = null;
window.onresize = function() {
  clearTimeout(resizeWaiting);
  resizeWaiting = setTimeout(function() {
    Group.groups.forEach(function(group) {
      group.recalculateCanvas();
    });
  }, 500);
  return;
};
