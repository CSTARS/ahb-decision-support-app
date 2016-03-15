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

DSSDK.app.grow = function(callback) {
  var c = 0;
  function onComplete() {
    c++;
    if( c === 2 ) {
      DSSDK.app.grown = true;
      DSSDK.app.getOnCompleteListeners().forEach(function(fn){
        fn();
      });
      callback();
    }
  }

  DSSDK.datastore.getTransportation(onComplete);

  // run at the same time as transportation
  DSSDK.datastore.getWeather(function(weather){
    DSSDK.datastore.getSoil(function(soil){
      
      DSSDK.datastore.getCropTypes(function(){
        DSSDK.model.growAll(true, onComplete);
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
