'use strict';

var request = require('superagent');
var config = require('../../lib/config').get().get('osrm');


function query(params, callback) {
  request
    .post(`http://${config.host}:${config.port}/`)
    .send(params)
    .end(function(err, res){
      if (err || !res.ok) {
        callback(err || 'Bad response from transportation service');
      } else {
        callback(null, res.body);
      }
    });
}

module.exports = {
  query : query
};
