var fs = require('fs');
var config;

module.exports = {
  get : function() {
    return config;
  },
  set : function(c) {
    config = c;
    init();
  }
};


function init() {
  // see if we have external config in include
  if( fs.existsSync('/etc/ahb-decision-support-app/config.json') ) {
    config.use(require('/etc/ahb-decision-support-app/config.json'));
  }
  
  // check for docker env overrides
  var dockerLinks = config.get('dockerLinks');
  var postgres = config.get('postgres');
  var osm2po = config.get('osm2po');
  
  if( process.env[`${dockerLinks.cropTypes}_PORT_5432_TCP_ADDR`] ) {
    postgres.cropTypes.host = process.env[`${dockerLinks.cropTypes}_PORT_5432_TCP_ADDR`];
    postgres.cropTypes.port = 5432;
  }
  if( process.env[`${dockerLinks.soilWeather}_PORT_5432_TCP_ADDR`] ) {
    postgres.soilWeather.host = process.env[`${dockerLinks.soilWeather}_PORT_5432_TCP_ADDR`];
    postgres.soilWeather.port = 5432;
  }
  if( process.env[`${dockerLinks.osm2po}_PORT_8889_TCP_ADDR`] ) {
    osm2po.host = process.env[`${dockerLinks.osm2po}_PORT_8889_TCP_ADDR`];
  }
}
