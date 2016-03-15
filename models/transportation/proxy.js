'use strict';

var request = require('superagent');
var config = require('../../lib/config').get().get('osm2po');

function findClosestVertex(geometry, callback) {
  if( geometry.type !== 'Point' ) {
    return callback('Geometry must be a point.');
  }

  var params = {
    cmd : 'fv',
    lon : geometry.coordinates[0],
    lat : geometry.coordinates[1],
    format : 'geojson'
  };

  query(params, callback);
}

function findRoute(sourceId, targetId, cache, callback) {
  if( cache[sourceId+'-'+targetId] ) {
    var c = cache[sourceId+'-'+targetId];
    return callback(c.err, c.resp);
  }

  var params = {
    cmd : 'fr',
    source : sourceId,
    target : targetId,
    format : 'geojson',
    findShortestPath:false,
    ignoreRestrictions:false,
    ignoreOneWays:false,
    routerId:0,
    heuristicFactor:0.0,
    maxCost:0.0,
    hull:false,
    key:'Key',
    value:'Value',
    tsp:''
  };

  query(params, function(err, resp){
    cache[sourceId+'-'+targetId] = {
      err : err,
      resp : resp
    };
    callback(err, resp);
  });
}

function query(params, callback) {
  request.
    get(config.host+':'+config.port+'/Osm2poService')
    .query(params)
    .end(function(err, res){
      if (err || !res.ok) {
        callback(err || 'Bad response from transportation service');
      } else {
        try {
          callback(null, JSON.parse(res.text));
        } catch (e) {
          callback('Bad response from transportation service');
        }

      }
    });
}

module.exports = {
  findRoute : findRoute,
  findClosestVertex : findClosestVertex
};
