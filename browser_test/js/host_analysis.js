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
      // if text, add to text content, if object: get text attribute, apply properties
      row_elem_inst = document.createElement('td');
      if(typeof rows[i][j] == "string") {
        row_elem_inst.textContent = rows[i][j];
      } else if ('text' in rows[i][j]){
        row_elem_inst.textContent = rows[i][j].text;
        var props = Object.keys(rows[i][j]);
        for (var k=0; k<props.length; k++) {
          if (props[k] != 'text') {
            row_elem_inst.setAttribute(props[k], rows[i][j][props[k]]);
          }
        }
      }
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
  var days = Math.floor(seconds / (3600*24));
  seconds -= days * 3600 * 24

  var hours = Math.floor(seconds / 3600) % 24;
  seconds -= hours * 3600;

  var minutes = Math.floor(seconds / 60) % 60;
  seconds -= minutes * 60;

  return [days, hours, minutes, seconds]
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

var canvas_elem = document.getElementById('simplified_graph');

var chart_points = function(points) {
  var canwidth = canvas_elem.width;
  var canheight = canvas_elem.height;
  var x=[], y=[];
  for(var i=0; i<points.length; i++) {
    x.push(points[i][0]);
    y.push(points[i][1]);
  }
  maxx = Math.max.apply(this, x);
  minx = Math.min.apply(this, x);
  difx = maxx - minx;
  maxy = Math.max.apply(this, y);
  miny = Math.min.apply(this, y);
  dify = maxy - miny;
  console.log(maxx, minx, maxy, miny)
  console.log(difx, dify);

  ctx = canvas_elem.getContext('2d');
  ctx.clearRect(0, 0, canwidth, canheight);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for(var i=0; i<points.length; i++) {
    _x = points[i][0] - minx;
    _y = points[i][1] - miny;
    ctx.lineTo(_x/difx*canwidth, _y/dify*canheight);
  }
  ctx.stroke();

  console.log([x, y])
}

var summary = document.getElementById('summary');

var add_hover_listener = function(elem) {
  var index = elem.getAttribute('piece-index');
  elem.addEventListener('mouseover', function() {chart_points(by_mac[document.MAC_SELF]['simplified'][index]['pieces']); });
}

var by_mac = {}
if (document.MAC_SELF) {
  mac_self = document.MAC_SELF;
  get_time_strength_data(mac_self).then(function(response) {
    by_mac[mac_self] = response;
    var simple = response.simplified;
    var simple_rows = [];
    for(var i=0; i<simple.length; i++) {
      var current_row = [];
      mintimesec = simple[i]['min_time']
      maxtimesec = simple[i]['max_time']
      mintime = convert_utc_epoch_to_date(mintimesec);
      maxtime = convert_utc_epoch_to_date(maxtimesec);
      diff = maxtimesec - mintimesec
      current_row.push({'text' : Math.floor(simple[i]['average_strength']), 'piece-index' : i});
      current_row.push(date_to_string(mintime));
      current_row.push(date_to_string(maxtime));
      diff_string = seconds_to_minutes_hours(diff)
      current_row.push(diff_string[0] + "  " + diff_string.slice(1).map(add_zeros).join(":"));
      simple_rows.push(current_row);
    }

    header = ['Avg Strength', 'Begin', 'End', 'Difference'];

    var table = build_table(header, simple_rows);
    return table;
  }).then(function(table) {
    var tph = summary.querySelector('#table_placeholder')
    if(tph) {
      tph.parentNode.replaceChild(table, tph);
    } else {
      summary.appendChild(table);
    }
  }).then(function() {
    var keys = Object.keys(by_mac);
    var simple = by_mac[document.MAC_SELF]['simplified'];
    var rows = summary.querySelectorAll('[piece-index]');
    for(var i=0; i<rows.length; i++) {
       add_hover_listener(rows[i]);
    }
  })

} else {
  console.log("template failed to add 'self' mac or script hasn't loaded properly yet");
}