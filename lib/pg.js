// docs: https://github.com/brianc/node-postgres
var pg = require('pg');
var client, willowClient, done;

// for now: ssh -f -N -L 5433:localhost:5432 [username]@alder.bioenergy.casil.ucdavis.edu
// for now: ssh -f -N -L 5434:localhost:32772 [username]@willow.bioenergy.casil.ucdavis.edu


//psql -h localhost -p 32772 ahb -U postgres


function connect(callback) {
  var config = require('./config').get().get('postgres')
  var ctConfig = config.cropTypes;
  var swConfig = config.soilWeather;
  
  var conString = `postgres://${swConfig.username}:${swConfig.password}@${swConfig.host}:${swConfig.port}/${swConfig.db}`;
  var count = 0;
  function ready() {
    count++;
    if( count == 2 ) {
      callback();
    }
  }
  
  pg.connect(conString, function(err, c, d) {
    if( err ) {
      throw new Error(err);
    }

    client = c;
    done = d;

    ready();
  });

  conString = `postgres://${ctConfig.username}:${ctConfig.password}@${ctConfig.host}:${ctConfig.port}/${ctConfig.db}`;
  pg.connect(conString, function(err, c, d) {
    if( err ) {
      throw new Error(err);
    }

    willowClient = c;
    ready();
  });
}

module.exports = {
  connect : connect,
  client : function() {
    return client;
  },
  willowClient : function() {
    return willowClient;
  }
};
