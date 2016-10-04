var async = require('async');
var pg = require('../lib/pg');
var Cursor = require('pg-cursor');

module.exports = function() {
  return {
    get : get
  };
};

function get(lat, lng, radius, res) {
  var result = [];

  var cursor = pg.willowClient().query(new Cursor(`
          SELECT ST_AsGeoJSON(geometry) as geometry, properties 
          FROM parcel_cache 
          where ST_DWITHIN(Geography(geometry), Geography(ST_MakePoint($1, $2)), $3)`,
          [parseFloat(lng), parseFloat(lat), parseFloat(radius)]));
          // WHERE ST_DWithin(geometry, ST_MakePoint($1, $2), $3)`,
          // [lng, lat, radius / 111112.21]));

  res.set('Content-Type', 'text/plain');
  read(cursor, res);
}

function read(cursor, res) {
  cursor.read(500, function(err, rows) {

    if( err || !rows ) {
      return res.end(JSON.stringify({error: true, message: err || 'No rows returned'}));
    }

    if( rows.length === 0 ) {
      return res.end('');
    }

    var geojson;
    rows.forEach((row) => {
      geojson = {
        geometry : JSON.parse(row.geometry),
        properties : JSON.parse(row.properties)
      }
      res.write(JSON.stringify(geojson)+'\n');
    });

    read(cursor, res);
  });
}
