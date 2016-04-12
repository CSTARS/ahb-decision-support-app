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
  var socket = io.connect('http://'+window.location.host);

  DSSDK.app.runConsole.onStart(lat, lng, radius, socket);

  var c = 0;
  function onComplete() {
    c++;
    if( c === 4 ) {
      DSSDK.app.grown = true;

      DSSDK.adoption.selectParcels();

      DSSDK.app.getOnCompleteListeners().forEach(function(fn){
        fn();
      });

      socket.disconnect();
      DSSDK.app.runConsole.onEnd();
      callback();
    }
  }

  DSSDK.datastore.getParcels(lat, lng, radius, function(){
    DSSDK.datastore.getCrops(function(){

      DSSDK.datastore.getTransportation(socket.id, onComplete);

      DSSDK.datastore.getCropPriceAndYield(onComplete);

      // run at the same time as transportation
      DSSDK.datastore.getWeather(function(weather){
        DSSDK.datastore.getSoil(function(soil){
          DSSDK.model.growAll(true, onComplete);
        });
      });


      DSSDK.datastore.getBudgets(onComplete);
    });
  });
};

DSSDK.app.setPoplarPrice = function(price) {
  DSSDK.datastore.poplarPrice = price;

//  document.querySelector('results-panel').setPoplarPrice(price);
//  document.querySelector('menu-parcel-options').setPoplarPrice(price);

  if( this.grown ) {
    DSSDK.adoption.selectParcels();
    DSSDK.app.getOnCompleteListeners().forEach(function(fn){
      fn();
    });
  }
};
DSSDK.app.getPoplarPrice = function() {
  return this.price || 24;
};
