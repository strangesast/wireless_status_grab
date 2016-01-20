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

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.render('index');
});

router.get('/hosts/', function(req, res, next) {
  hosts = [];
  queries = [
    "SELECT * from wireless_arp_table"
    //'select mac, max(datetime) from wireless_hosts group by mac;'
  ];
  Promise.all(queries.map(function(query) {
    return queryPromise(query);
  })).then(function(results) {
    rows = results[0];
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

module.exports = router;
