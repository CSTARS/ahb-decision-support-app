// docs: https://github.com/brianc/node-postgres
var pg = require('pg');
var client, done;

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
}

module.exports = {
  connect : connect,
  client : function() {
    return client;
  }
};
