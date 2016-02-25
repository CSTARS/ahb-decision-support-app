DSSDK.app = {};

DSSDK.app.grow = function(callback) {
  DSSDK.datastore.getWeather(function(weather){
    DSSDK.datastore.getSoil(function(soil){
      DSSDK.datastore.getTransportation(function(){
        DSSDK.datastore.getCropTypes(function(){
          DSSDK.model.growAll(true, callback);
        });
      });
    });
  });
};

DSSDK.app.setPoplarPrice = function(price) {
  this.price = price;
};
DSSDK.app.getPoplarPrice = function() {
  return this.price || 24;
};
