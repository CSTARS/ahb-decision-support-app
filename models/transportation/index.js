var async = require('async');
var extend = require('extend');
var simplify = require('simplify-geometry');
var proxy = require('./proxy');
var socket = require('../../lib/socket');

var CHUNK_SIZE = 500;
var tolerance = 0.001;

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
  var ids = {}, currentSocket;


  if( options.socketId ) {
    var s = socket.get(options.socketId);
    if( s ) {
      currentSocket = s;
    } else {
      return callback('SocketId not found: '+options.socketId);
    }
  }
  
  currentSocket.on('disconnect', function() {
    options.requestCancelled = true;
  });


  var chunks = [], chunk = [];
  for( var i = 0; i < sources.features.length; i++ ) {
    chunk.push(sources.features[i].geometry.coordinates);
    
    if( i % CHUNK_SIZE === 0 && i !== 0 ) {
      chunks.push(chunk);
      chunk = [];
    }
  }
  if( chunk.length > 0 ) {
    chunks.push(chunk);
  }
  
  var time = new Date().getTime();
  var count = 0;
  var chunkCount = 0;

  async.eachSeries(
    chunks,
    function(chunk, next) {
      if( options.requestCancelled ) {
        return next();
      }
      
      var params = {
        sources : JSON.stringify(chunk),
        destination : JSON.stringify(destination.geometry.coordinates),
        steps : options.routeGeometry ? true : false
      }
      
      proxy.query(params, (err, queryResult) => {
        processPaths(queryResult, result, count, chunkCount, sources, params.steps);
        
        count += chunk.length;
        sendUpdate(time, count, sources.features.length, result, currentSocket);
        result = init();
        chunkCount++;
        
        next();
      });
    },
    function(err) {
      if( options.requestCancelled ) {
        result = null;
        return currentSocket.emit('routes-calculated', {error:true, message: 'Request Cancelled'});
      }
      
      currentSocket.emit('routes-calculated', result);
      result = null;
    }
  );
}


function processPaths(pathResults, finalResult, count, chunkCount, sources, steps) {
  for( var i = 0; i < pathResults.length; i++ ) {
    processPath(pathResults[i], finalResult, sources.features[count+i], steps, chunkCount);
  }
}

function processPath(pathResult, finalResult, feature, steps, chunkCount) {

  /**
   * TODO: can we simplify geometry here?
   */
  pathResult.steps.coordinates = simplify(pathResult.steps.coordinates, tolerance);

  if( steps ) {
    var path = [], start, stop, id;
    for( var i = 1; i < pathResult.steps.coordinates.length; i++ ) {
      start = pathResult.steps.coordinates[i-1];
      stop = pathResult.steps.coordinates[i];
      id = start.join('-')+','+stop.join('-')
      
      if( finalResult.network.features[id] ) {
        finalResult.network.features[id].properties.count++;
        path.push(finalResult.network.features[id].properties.id);
      } else {
        finalResult.network.features[id] = {
          geometry : {
            type : 'LineString',
            coordinates : [start, stop]
          },
          properties : {
            id : id,
            count : 0
          }
        }
        
        path.push(id);
        finalResult.networkSegmentCount++;
      }
    }
    
    pathResult.path = path;
    delete pathResult.steps;
  }
    
  
  pathResult.id = feature.properties.id;
  pathResult.distance = pathResult.distance / 1000;
  pathResult.distanceUnit = 'km';
  pathResult.duration = pathResult.duration / (60 * 60);
  pathResult.durationUnit = 'h';
  
  finalResult.paths.push(pathResult);
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
    paths : [],
    networkSegmentCount : 0,
    network : {
      type : "FeatureCollection",
      features : {}
    }
  };
}

function sendUpdate(time, count, total, result, currentSocket) {
  if( !currentSocket ) return;

  var t2 = new Date().getTime();

  try {
    var p = Math.floor((count/total) * 100);

    var t = (t2 - time) / count; // current average time

    currentSocket.emit('transportation-update', {
      complete: count,
      total : total,
      percent : p,
      averageTime : t,
      data : result,
      timeRemaining : ((total - count) * t)
    });
  } catch(e) {

  }

}
