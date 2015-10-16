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
  for(var i=0; i<rows.length; i++) {
    var row = rows[i];
    var ladom = row.querySelector('.last_active');
    // HERE
    ladom.textContent = "toast"
  }
  //var prom = makeRequest('/active/' + mac, 'POST', JSON.stringify(params));
}

update_last_active()
