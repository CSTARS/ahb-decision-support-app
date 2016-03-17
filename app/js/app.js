DSSDK.app = {};

(function(){
  var listeners = [];
  DSSDK.app.setOnCompleteListener = function(fn) {
    listeners.push(fn);
  };
  DSSDK.app.getOnCompleteListeners = function() {
    return listeners;
  };
})();

DSSDK.app.run = function(lat, lng, radius, callback) {

  // open a socket for transportation updates
  var socket = io.connect('http://localhost:8000');

  DSSDK.app.runConsole.onStart(lat, lng, radius, socket);

  var c = 0;
  function onComplete() {
    c++;
    if( c === 2 ) {
      DSSDK.app.grown = true;

      DSSDK.datastore.selectParcels();

      DSSDK.app.getOnCompleteListeners().forEach(function(fn){
        fn();
      });

      socket.disconnect();
      DSSDK.app.runConsole.onEnd();
      callback();
    }
  }

  DSSDK.datastore.getParcels(lat, lng, radius, function(){
    DSSDK.datastore.getTransportation(socket.id, onComplete);

    // run at the same time as transportation
    DSSDK.datastore.getWeather(function(weather){
      DSSDK.datastore.getSoil(function(soil){

        DSSDK.datastore.getCropTypes(function(){
          DSSDK.model.growAll(true, onComplete);
        });

      });
    });
  });


};

DSSDK.app.setPoplarPrice = function(price) {
  this.price = price;

  document.querySelector('results-panel').setPoplarPrice(price);
  document.querySelector('menu-parcel-options').setPoplarPrice(price);

  if( this.grown ) {
    DSSDK.datastore.resetSelectedParcels();
    var eles = document.querySelectorAll('parcel-list-item');
    for( var i = 0; i < eles.length; i++ ) {
      eles[i].onComplete();
    }
    document.querySelector('parcel-map').onSelectedUpdated();
    document.querySelector('results-panel').update();
  }
};
DSSDK.app.getPoplarPrice = function() {
  return this.price || 24;
};
