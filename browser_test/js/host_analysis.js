console.log("toast");

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

var get_time_strength_data = function(mac, range) {
  // get a simplified version
  var params = {'params' : ['simplified']}
  var prom = makeRequest('/host/' + mac, 'POST', JSON.stringify(params));
  return prom
}

var build_table = function(header, rows) {
  var table = document.createElement('table');
  var header_row = document.createElement('tr');
  for(var i=0; i<header.length; i++) {
    header_elem = document.createElement('td')
    header_elem.textContent = header[i]
    header_row.appendChild(header_elem);
  }
  table.appendChild(header_row);
  for(var i=0; i<rows.length; i++) {
    row_elem = document.createElement('tr');

    for(var j=0; j<rows[i].length; j++) {
      row_elem_inst = document.createElement('td');
      row_elem_inst.textContent = rows[i][j];
      row_elem.appendChild(row_elem_inst);
    }

    table.appendChild(row_elem);
  }

  return table
}

var convert_utc_epoch_to_date = function(seconds_epoch) {
  var d = new Date(0);
  d.setUTCSeconds(seconds_epoch);
  return d
}


var seconds_to_minutes_hours = function(seconds) {
  var hours = Math.floor(seconds / 3600) % 24;
  seconds -= hours * 3600;

  var minutes = Math.floor(seconds / 60) % 60;
  seconds -= hours * 60;

  return [hours, minutes, seconds]
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


var summary = document.getElementById('summary');

if (document.MAC_SELF) {
  mac_self = document.MAC_SELF;
  get_time_strength_data(mac_self).then(function(response) {
    var simple = response.simplified;
    var simple_rows = [];
    for(var i=0; i<simple.length; i++) {
      var current_row = [];
      mintimesec = simple[i]['min_time']
      maxtimesec = simple[i]['max_time']
      mintime = convert_utc_epoch_to_date(mintimesec);
      maxtime = convert_utc_epoch_to_date(maxtimesec);
      diff = maxtimesec - mintimesec
      current_row.push(Math.floor(simple[i]['average_strength']));
      current_row.push(date_to_string(mintime));
      current_row.push(date_to_string(maxtime));
      current_row.push(seconds_to_minutes_hours(diff).join(":"))
      simple_rows.push(current_row);
    }

    header = ['Avg Strength', 'Begin', 'End', 'Difference'];

    var table = build_table(header, simple_rows);
    summary.appendChild(table);
  })
} else {
  console.log("template failed to add 'self' mac or hasn't loaded properly yet");
}
