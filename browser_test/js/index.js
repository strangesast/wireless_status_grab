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
  makeRequest('/active', 'GET', null).then(function(active_macs) {
    for(var i=0; i<rows.length; i++) {
      var row = rows[i];
      var mac = row.getAttribute('mac');
      var ladom = row.querySelector('.last_active');
      if (mac in active_macs) {
        var datetime = convert_utc_epoch_to_date(active_macs[mac]);
        ladom.textContent = date_to_string(datetime);
        ladom.classList.add('recent');
      } else {
        ladom.classList.remove('recent');
      }
    }
  });
}

update_last_active();
var updateint = setInterval(function() {
  Promise.resolve(function() {
    // initiate loading symbol
  }).then(update_last_active).catch(function() {
    console.log("failed");
    clearInterval(updateint);
  }).then(function() {
    // reset loading symbol
  });
}, 1000*60*2);
