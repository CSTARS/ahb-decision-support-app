// docs: https://github.com/brianc/node-postgres
var pg = require('pg');
var database;


var conString = "postgres://username:password@localhost/database";
var client = new pg.Client(conString);

function connect(config, callback) {
  client.connect(config.get('pg').connectionString, function(err) {
    if( err ) {
      return callback(err);
    }

    callback(null, client);
  });
}

module.exports = {
  connect : connect,
  db : function() {
    return client;
  }
};
