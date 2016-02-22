var ll = [40.600445, -122.204414];
var radius = 15*1000;

var t = new Date().getTime();
var rand = 0.3;

console.log('Finding parcels '+ll.join(',')+' @ '+(radius/1000)+'km radius ...');
DSSDK.datastore.getParcels(ll[0], ll[1], radius, function(err, parcels){
  if( err ) {
    console.log(err);
  }

  DSSDK.datastore.randomizeSelected(rand);

  console.log('Retrieving weather...');
  DSSDK.datastore.getWeather(function(weather){
    console.log('Retrieving soil...\n');
    DSSDK.datastore.getSoil(function(soil){


      console.log('Loading farm budget for poplar...\n');
      DSSDK.budget.load(function(){
        DSSDK.model.growAll();
        console.log('\nDone. '+DSSDK.datastore.selectedParcels.length+' parcels. '+
          (rand*100)+'% random sample. '+(new Date().getTime()-t)+'ms');
      });
    });
  });
});
