var makeRequest = function(url, method, updateFunc) {
  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        return resolve(request);
      } else {
        return reject(request);
      }
    };
    request.onerror = function() {
      return reject(request);
    };
    if(updateFunc) {
      request.onprogress = updateFunc;
    }
    request.send();
  });
};

generateURIfromObj = function(obj) {
  var out = []
  for(var prop in obj) {
    out.push(prop + '=' + encodeURIComponent(obj[prop]));
  }
  return '?' + out.join('&');
}

//var CanvasGraph = class CanvasGraph {
//  constructor(canvas_element) {
//    this.canvas = canvas_element
//  }
//}
