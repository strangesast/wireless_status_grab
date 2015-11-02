var makeRequest = function(url, method, data, progress_listener) {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    if(method != "GET") {
      request.setRequestHeader('Content-Type', 'application/json')
    }
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        try {
          // json
          var data = JSON.parse(request.responseText);
        } catch (e) {
          // probably not json
          var data = request.responseText
        }
        return resolve(data);
      } else {
        return reject("request failed")
      }
    }
    request.onerror = function() {
      reject("request failed")
    }
    request.addEventListener("progress", progress_listener);
    if (data) {
      request.send(data)
    } else {
      request.send()
    }
  })
}

progress_bar = document.getElementById('progress_bar');

var progress_func = function(e) {
  if (e.lengthComputable) {
    progress_bar.setAttribute("value", e.loaded/e.total * 100);
  }
}

var time1 = Math.floor(new Date().valueOf() / 1000) - 3600;
var time2 = Math.floor(new Date().valueOf() / 1000);

var canvas;
Promise.resolve(function() {
  // show progress bar, attach listener,
  // progress_bar
}).then(function() {
  var ob = {'t1' : time1, 't2' : time2}
  return makeRequest('/records_in_range', 'POST', JSON.stringify(ob), progress_func);

}).then(function(response) {
  canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'time_slider');
  progress_bar.parentNode.replaceChild(canvas, progress_bar);

  plot_response(response)
}).then(function() {
  // hide progress
});

var plot_response = function(by_mac) {
  var canwidth = window.innerWidth
  var canheight = window.innerHeight;
  var padding = 100;
  canvas.width = canwidth;
  canvas.height = canheight;
  var ctx = canvas.getContext('2d');

  var macs = Object.keys(by_mac);

  var timediff = time2 - time1;

  for(var i=0; i<macs.length; i++) {
    var mac = macs[i];
    var mac_data = by_mac[mac];
    ctx.beginPath();
    for(var j=0; j<mac_data.length; j++) {
      var cu = mac_data[j].slice(8);
      var xpos = (cu[1] - time1)/timediff*(canwidth - 2*padding) + padding;
      var ypos = cu[0] / 1000 * (canheight - 2*padding) + padding;
      if(j==0) {
        ctx.moveTo(xpos, ypos);
      } else {
        ctx.lineTo(xpos, ypos);
      }
    }
    ctx.strokeStyle = 'rgb(' + Math.floor(Math.random()*255) + ', ' + Math.floor(Math.random()*255) + ', 255)'
    ctx.stroke();
  }
  return;
  var xs = [];
  var ys = [];
  for(var i=0; i<array.length; i++) {
    var elem = array[i];
    both = elem.slice(8);
    y = both[0];
    x = both[1];
    xs.push(x);
    ys.push(y);
  }
}
