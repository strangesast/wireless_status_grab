var hosts_container = document.getElementById('hosts-container');

var compare_hosts_button = document.getElementById('compare-hosts');

monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Oct', 'Dec'];
var formatDate = function(dateObject) {
  var day = dateObject.getDay(),
      month = dateObject.getMonth(),
      year = dateObject.getFullYear();
  return [monthAbbr[month], day, year].join(' ');
};

var localdata = {};

makeRequest('/hosts/lastactive', 'GET', null).then(function(response) {
  var resp = JSON.parse(response.response);
  var activeByMac = {};
  for(var j=0; rec=resp[j], j < resp.length; j++) {
    activeByMac[rec.mac] = rec['max(datetime)'];
  }
  var hosts = hosts_container.querySelectorAll('[type=host]');
  for(var i=0; host=hosts[i], i<hosts.length; i++) {
    var lastActive = activeByMac[host.getAttribute('mac')];
    var lastActiveElem = host.querySelector('.last-active');
    if(lastActive !== undefined) {
      var d = new Date(lastActive*1000);
      lastActiveElem.textContent = formatDate(d);
      lastActiveElem.setAttribute('title', d);
      host.setAttribute('datetime', lastActive);
    } else {
      lastActiveElem.textContent = 'unknown';
    }
  }
  var hash = window.location.hash;
  if(hash !== "") {
    var type = hash.split('#by')[1];
    sortByType(type);
  }

}).catch(function(error) {
  alert(JSON.stringify(error));
});

sortByType = function(type) {
  var reverse = false;
  if(type == "mac") {
    type = 'mac';
  } else if (type=="name") {
    type = "hostname";
  } else {
    type = 'datetime';
    reverse = true;
  }

  var domitems = hosts_container.children;
  var items = [];

  for(var i=0; i<domitems.length; i++) {
    items.push(domitems[i]);
  }
  items.sort(function(a, b) {
    val1 = a.getAttribute(type).toLowerCase();
    val2 = b.getAttribute(type).toLowerCase();
    oppa = reverse ? -1 : 1;
    return val1 == val2 ? 0 : (val1 > val2 ? oppa : -oppa ); 
  });
  for(i=0; i< items.length; i++) {
    hosts_container.appendChild(items[i]);
  }

};

var checkboxChangeEvent = function(e) {
  var checkboxes = document.querySelectorAll("[name=options]:checked");

  var out = [];
  for(var i=0; i < checkboxes.length; i++) {
    out.push(checkboxes[i].parentNode.parentNode.parentNode.parentNode.getAttribute('mac'));
  }
  if(out.length > 0) {
    // activate button
    compare_hosts_button.disabled = false
  } else {
    // deactivate button
    compare_hosts_button.disabled = true
  }
  localdata.selected = out;
  return true;
}

var compareButtonSelectedEvent = function(e) {
  if(!localdata || !(localdata.selected)) {
    return false;
  }
  var out = {};
  for(var i=0; i< localdata.selected.length; i++) {
    var selected_element = localdata.selected[i];
    out['host' + i] = selected_element;
  }
  window.location.href = '/compare' + generateURIfromObj(out);
  return true;
}

compare_hosts_button.onclick = compareButtonSelectedEvent;

var addCheckboxListeners = function() {
  localdata.selected = []; // gah
  var checkboxes = document.querySelectorAll("[name=options]");
  for (var i=0; i<checkboxes.length; i++) {
    var checkbox = checkboxes[i];
    checkbox.onchange = checkboxChangeEvent;
  }
  return;
}
addCheckboxListeners();

var hashChangeEvent = function(e) {
  var hash = window.location.hash;
  var type = hash.split('#by')[1];
  sortByType(type);
};

window.addEventListener("hashchange", hashChangeEvent, false);
