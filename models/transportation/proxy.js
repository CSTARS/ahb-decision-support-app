'use strict';

var request = require('superagent');
var config = require('../../lib/config').get().get('osm2po');

var globalCache = require('./cache');

function findClosestVertex(geometry, callback) {
  if( geometry.type !== 'Point' ) {
    return callback('Geometry must be a point.');
  }
  
  var id = geometry.coordinates[0]+'-'+geometry.coordinates[1];
  // var cachedItem = checkCaches(id);
  // if( cachedItem ) {
  //   return callback(cachedItem.err, cachedItem.resp);
  // }

  var params = {
    cmd : 'fv',
    lon : geometry.coordinates[0],
    lat : geometry.coordinates[1],
    format : 'geojson'
  };

  query(params, function(err, resp){
    setCaches(id, {
      err : err,
      resp : resp
    });
    callback(err, resp);
  });
}

function checkCaches(id, requestCache) {
  return null;
  // if( requestCache && requestCache[id] ) {
  //   return requestCache[id];
  // }
  // return globalCache.get(id);
}

function setCaches(id, value, requestCache) {
  return;
  // if( requestCache ) {
  //   requestCache[id] = value;
  // }
  // globalCache.set(id, value);
}

// this just kicks out oldest items
function clearCache() {
  return;
  // globalCache.clear();
}

function findRoute(sourceId, targetId, cache, callback) {
  var id = sourceId+'-'+targetId;
  
  // var cachedItem = checkCaches(id, cache);
  // if( cachedItem ) {
  //   return callback(cachedItem.err, cachedItem.resp);
  // }

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
    setCaches(id, {
      err : err,
      resp : resp
    }, cache);
    callback(err, resp);
  });
}

function query(params, callback) {
  request.
    get(`http://${config.host}:${config.port}/Osm2poService`)
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
  findClosestVertex : findClosestVertex,
  clearCache : clearCache
};
