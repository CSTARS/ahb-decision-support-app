var async = require('async');
var pg = require('../../lib/pg');
var yields = require('./yields');

var crops = ['Alfalfa Hay','Alfalfa Haylage','Barley','Beans, Dry Edible',
'Canola','Corn Grain','Corn Silage','Grass Hay','Grass Haylage','Lentils','Oats',
'Potatoes','Spring Wheat','Sugarbeets','Winter Wheat'];

// no yields: lentils, potatoes
// prices: 'Corn Grain','Corn Silage','Grass Hay','Grass Haylage','Alfalfa','Alfalfa Haylage'

var query =
`SELECT state
 FROM national_atlas.state s
 WHERE ST_Contains(
        s.boundary,
        ST_Transform(
          ST_SetSRID(
            ST_MakePoint($1, $2)
            ,4326),
          97260)
        );`;

module.exports = function() {
  return {
    getCrops : getCrops
  };
};

function getCrops(geometryCollection, callback) {
  var result = [];

  async.eachSeries(
    geometryCollection.geometries,
    function(geometry, next){
      getCrop(geometry, result, next);
    },
    function(err) {
      callback(null, result);
    }
  );
}

function getCrop(geometry, result, next) {
  var p;

  var crop = Math.floor(Math.random()*crops.length);
  crop = crops[crop];

  try {
    if( geometry.type === 'Polygon' ) {
      p = geometry.coordinates[0][0];
    } else {
      p = geometry.coordinates[0][0][0];
    }
  } catch(e) {
    results.push({error: true, id: 1, message: e, crop: crop});
    return next();
  }

  pg.client().query(query, p, function(err, resp){
    if( err ) {
      result.push({error: true, id: 2, message: err, crop: crop});
    } else {
      resp = resp.rows[0];
      resp.crop = crop;

      checkCrop(resp, crop);

      var t = yields(resp.state, resp.crop);
      resp.yield = t.yield;
      resp.price = t.price;

      result.push(resp);
    }

    next();
  });
}

function checkCrop(resp) {
  while( resp.state === 'California' && (resp.crop === 'Lentils' || resp.crop === 'Canola') ) {
    var crop = Math.floor(Math.random()*crops.length);
    resp.crop = crops[crop];
  }
}
