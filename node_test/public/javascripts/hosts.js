hosts_container = document.getElementById('hosts-container');

monthAbbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Oct', 'Dec'];
var formatDate = function(dateObject) {
  var day = dateObject.getDay(),
      month = dateObject.getMonth(),
      year = dateObject.getFullYear();
  return [monthAbbr[month], day, year].join(' ');
};

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

var hashChangeEvent = function(e) {
  var hash = window.location.hash;
  var type = hash.split('#by')[1];
  sortByType(type);
};

window.addEventListener("hashchange", hashChangeEvent, false);
