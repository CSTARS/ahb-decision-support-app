var async = require('async');
var extend = require('extend');
var proxy = require('./proxy');

module.exports = function() {
  return {
    getRoutes : getRoutes
  };
};

/**
  Sources : Feature Collection
  destination : Feature
  options : object
**/
function getRoutes(sources, destination, options, callback) {
  var result = init();
  var destinationVertex;
  var ids = {};

  proxy.findClosestVertex(destination.geometry, function(err, vertex){
    if( err ) {
      return callback('Unable to locate vertex for destination.  Please try another location');
    }

    destinationVertex = vertex;
    var cache = {};

    async.eachSeries(
      sources.features,
      function(source, next) {
        findPath(source, destinationVertex, cache, function(err, pathresult){
          if( err ) {
            result.paths.features.push(createErrorFeature(err));
            return next();
          } else {
            processPath(pathresult, result, ids);
            next();
          }
        });
      },
      function(err) {
        result.use = ids;
        callback(null, processErrors(sources.features, result));
      }
    );
  });
}

// fine nearest neighor for errors
function processErrors(sources, result) {
  var i, f;
  for( i = 0; i < result.paths.features.length; i++ ) {
    f = result.paths.features[i];
    if( f.properties.error ) {
      setClosest(sources, result.paths.features, i);
    }
  }

  return result;
}

function setClosest(sources, features, index) {
  var minDistance = 9999;
  var minIndex = -1;
  var i, d;

  for( i = 0; i < sources.length; i++ ) {
    if( index === i ) {
      continue;
    }
    if( features[i].properties.error ) {
      continue;
    }

    d = distance(sources[index].geometry.coordinates, sources[i].geometry.coordinates);
    if( d < minDistance ) {
      minDistance = d;
      minIndex = i;
    }
  }

  // no match :(
  if( minIndex === -1 ) {
     return;
  }

  features[index] = extend(true, {}, features[minIndex]);
  features[index].properties.guess = true;
}

function distance(start, stop) {
  return Math.sqrt(Math.pow(start[1] - stop[1], 2) +  Math.pow(start[0] - stop[0], 2));
}


function findPath(source, destinationVertex, cache, callback) {
  proxy.findClosestVertex(source.geometry, function(err, sourceVertex){
    if( err ) {
      return callback('Unable to locate vertex for destination.  Please try another location');
    }

    var result = {
      path : {
        type : 'Feature',
        geometry : 'LineString',
        coordinates : [
          sourceVertex.geometry.coordinates,
          destinationVertex.geometry.coordinates
        ],
        properties : {
          id: sourceVertex.properties.id+'-'+destinationVertex.properties.id,
          source: sourceVertex.properties.id,
          destination: destinationVertex.properties.id
        }
      },
      network : {}
    };

    proxy.findRoute(sourceVertex.properties.id, destinationVertex.properties.id, cache, function(err, network){
      if( err ) {
        return callback(err);
      }

      result.network = network;
      callback(null, result);
    });

  });
}

function processPath(pathresult, finalresult, ids) {
  if( !pathresult.network.features ) {
    return;
  }

  var path = [], id;
  var distance = 0;
  var time = 0;

  pathresult.network.features.forEach(function(feature){
    id = feature.properties.id;
    path.push(id);

    distance += feature.properties.length;
    time += feature.properties.time;

    if( ids[id] === undefined ) {
      finalresult.network.features.push(feature);
      ids[id] = 1;
    } else {
      ids[id] += 1;
    }
  });

  var feature = pathresult.path;
  feature.properties.path = path;
  feature.properties.distance = distance;
  feature.properties.time = time;

  finalresult.paths.features.push(feature);
}

function createErrorFeature(err) {
  return {
    type : 'Feature',
    geometry : {
      type : 'Point',
      coordinates : [0,0]
    },
    properties : {
      error : true,
      message : err
    }
  };
}

function init() {
  return {
    paths : {
      type : "FeatureCollection",
      features : []
    },
    network : {
      type : "FeatureCollection",
      features : []
    }
  };
}
