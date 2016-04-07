// docs: https://github.com/brianc/node-postgres
var pg = require('pg');
var client, willowClient, done;

// for now: ssh -f -N -L 5433:localhost:5432 [username]@alder.bioenergy.casil.ucdavis.edu
// for now: ssh -f -N -L 5434:localhost:32772 [username]@willow.bioenergy.casil.ucdavis.edu


//psql -h localhost -p 32772 ahb -U postgres


function connect(callback) {
  var config = require('./config').get().get('postgres');
  var conString = 'postgres://'+config.username+':'+config.password+'@'+config.host+'/'+config.db;

  pg.connect(conString, function(err, c, d) {
    if( err ) {
      return callback(err);
    }

    client = c;
    done = d;

    callback(null, client);
  });

  config = require('./config').get().get('postgresWillow');
  conString = 'postgres://'+config.username+'@'+config.host+'/'+config.db;
  pg.connect(conString, function(err, c, d) {
    if( err ) {
      console.log(err);
    }

    willowClient = c;
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
