var makeRequest = function(url, method, data) {
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
    if (data) {
      request.send(data)
    } else {
      request.send()
    }
  })
}

var convert_utc_epoch_to_date = function(seconds_epoch) {
  var d = new Date(0);
  d.setUTCSeconds(seconds_epoch);
  return d
}

var add_zeros = function(num) {
  var size = 2
  var str = "00000000000" + num;
  return str.substr(str.length-size);
}

var date_to_string = function(date) {
  var cday = date.getDate();
  var cmonth = date.getMonth() + 1;
  var cyear = date.getFullYear();
  var chour = date.getHours();
  var cmin = date.getMinutes();
  var csec = date.getSeconds();
  var daystring = [cmonth, cday, cyear].map(add_zeros).join('/');
  var timestring = [chour, cmin, csec].map(add_zeros).join(':');

  return daystring + " " + timestring;
}

var update_last_active = function() {
  var rows = document.getElementById('mactable').querySelectorAll('[mac]');
  queue = [];
  for(var i=0; i<rows.length; i++) {
    var row = rows[i];
    var mac = row.getAttribute('mac');
    var ladom = row.querySelector('.last_active');
    var prom = makeRequest('/active/' + mac, 'POST', null).then((function(obj) {
      return function(response) {
        if(!isNaN(response)) {
          var d = convert_utc_epoch_to_date(response);
          var diff = Math.abs(new Date() - d);
          obj.textContent = date_to_string(d);
          if (diff < 1000*60*15) {
            obj.classList.add('recent');
          } else {
            obj.classList.remove('recent');
          }
        }
      }
    })(ladom));
    queue.push(prom);
  }
  return Promise.all(queue);
}

update_last_active();
var updateint = setInterval(function() {
  update_last_active().catch(function() {
    console.log("failed");
    clearInterval(updateint);
  });
}, 8000);
