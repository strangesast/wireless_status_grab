var general = {
  domElemWithProps : function(elementName, elementProps) {
    var elem, prop;
    elem = document.createElement(elementName);
    for (prop in elementProps) {
      elem.setAttribute(prop, elementProps[prop]);
    }
    return elem;
  },
  makeRequest : function(url, method, data, updateFunc) {
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
      request.onerror = function(error) {
        return reject(error);
      };
      if(updateFunc) {
        request.onprogress = updateFunc;
      }
      request.send(data);
    });
  },
  generateURIfromObj : function(obj) {
    var out = [];
    for(var prop in obj) {
      out.push(prop + '=' + encodeURIComponent(obj[prop]));
    }
    return '?' + out.join('&');
  },
  min : function(iterable, key) {
    if(key) {
      iterable = iterable.map(function(elem){ return elem[key];});
    }
    return iterable.reduce(function(a, b) {
      return (a < b ? a : b);
    });
  },
  max : function(iterable, key) {
    if(key) {
      iterable = iterable.map(function(elem){ return elem[key];});
    }
    return iterable.reduce(function(a, b) {
      return (a > b ? a : b);
    });
  },
};

document.general = general;
