var express = require('express');
var router = express.Router();
var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();
var config = require('../config');
var db_location = config.db_location;

var db = new sqlite3.Database(db_location);

var queryPromise = function(query) {
  return new Promise(function(resolve, reject) {
    db.all(query, function(err, rows) {
      if(err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
};

router.get('/', function(req, res, next) {
  return res.render('index');
});

router.get('/hosts/', function(req, res, next) {
  hosts = [];
  queries = [
    "SELECT * from wireless_arp_table",
    "select distinct mac from wireless_hosts where datetime > (select max(datetime) from wireless_hosts) - 180"
    //"SELECT DISTINCT mac from wirless_arp_table"// WHERE datetime = (SELECT max(datetime) FROM wireless_hosts)"
    //'select mac, max(datetime) from wireless_hosts group by mac;'
  ];
  Promise.all(queries.map(function(query) {
    return queryPromise(query);
  })).then(function(results) {
    rows = results[0];
    var macs = results[1].map(function(e) {
      return e.mac;
    });
    rows.map(function(e) {
      if(macs.indexOf(e.mac) > -1) {
        e.home = true;
      } else {
        e.home = false;
      }
    });
    return res.render('hosts', { hosts: rows });
  });
});

router.get('/hosts/lastactive', function(req, res, next) {
  queryPromise('select mac, max(datetime) from wireless_hosts group by mac;').then(function(result) {
    res.json(result);
  }).catch(function(error) {
    res.status(500).json(error);
  });
});

router.get('/hosts/:hostmac', function(req, res, next) {
  var hostmac = req.params.hostmac;
  query = 'SELECT * from wireless_arp_table where mac = "' + hostmac + '"';
  queryPromise(query).then(function(rows) {
    if(rows.length > 0) {
      properties = rows[0];
    } else {
      properties = null;
    }
    return res.render('host', properties=properties);

  }).catch(function(error) {
    return res.json(error);
  });
});

router.get('/hosts/:hostmac/records', function(req, res, next) {
  var min = null,
      max = null;
  hostmac = req.params.hostmac;
  d = new Date();
  d.setDate(d.getDate()-7); // records from as much as 7 days ago
  min = Math.floor(d.getTime() / 1000);
  query = 'select mac, signal_strength, datetime from wireless_hosts where';
  if(min !== null || max !== null) {
    query += ' datetime';
  }
  if(min !== null) {
    query += ' >= ' + min;
  }
  if(min !== null && max !== null) {
    query += ' and';
  }
  if(max !== null) {
    query += ' datetime <= ' + max;
  }
  if(max !== null || min !== null) {
    query += ' and';
  }
  query += ' mac="' + hostmac + '"';
  console.log(query);
  queryPromise(query).then(function(result) {
    return res.json(result);

  }).catch(function(error) {
    return res.json(error);
  });
});

router.get('/records/', function(req, res, next) {
  query = "select mac, datetime, signal_strength from wireless_hosts where datetime > (select max(datetime) from wireless_hosts) - 600 order by mac asc";
  queryPromise(query).then(function(result) {
    var currentMac = "";
    var out = {};
    for(var i=0; i<result.length; i++) {
      var row = result[i];
      if (currentMac !== row.mac) {
        currentMac = row.mac;
        out[currentMac] = [];
      }
      delete row.mac;
      out[currentMac].push(row);
    }
    return res.render('records', {records: out});

  }).catch(function(error) {
    res.json(error);
  });
});


module.exports = router;
