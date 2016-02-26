DSSDK.app = {};

DSSDK.app.grow = function(callback) {
  DSSDK.datastore.getWeather(function(weather){
    DSSDK.datastore.getSoil(function(soil){
      DSSDK.datastore.getTransportation(function(){
        DSSDK.datastore.getCropTypes(function(){
          DSSDK.model.growAll(true, callback);
          DSSDK.app.grown = true;
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
