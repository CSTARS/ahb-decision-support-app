var sdk = require('farm-budgets-sdk')({host: 'http://farmbudgets.org'});

var q = {
  query : {
    authority : 'AHB',
  }, // mongodb query
  start : 0, // start index
  stop : 10, // stop index
};
var re = new RegExp(TOKEN+'$');

sdk.budgets.search(q, function(resp){
  var id = '';
  for( var i = 0; i < resp.results.length; i++ ) {
    if( resp.results[i].description && resp.results[i].description.match(re) ) {
      return callback(resp.results[i]);
    }
  }

  callback(null);
});
