var fs = require('fs');
var isValid = require('./isValid');
var sdk = require('../../../ahb-decision-support-sdk/lib');

var center = {
  lat : 44.133,
  lng : -118.009
}
var radius = 700000;
// var radius = 100000;

sdk.config.ahbServer = 'http://localhost:8000';

if( fs.existsSync('parcelCacheData.txt') ) {
  fs.unlinkSync('parcelCacheData.txt');
}

sdk.eventBus.on('parcels-update-start', onParcelStart);
sdk.eventBus.on('parcels-update-updated', onParcelUpdated);
sdk.eventBus.on('parcels-update-end', onParcelEnd);

sdk.collections.parcels.useParcelCache = false;
sdk.collections.parcels.load(center.lat, center.lng, radius, () => {
  var parcels = sdk.collections.parcels.getAllInline();

  console.log('Writing out file...');
  var stream = fs.createWriteStream('parcelCacheData.txt', {flags: 'w'});
  
  for( var key in parcels ) {
    var geom = isValid(parcels[key]);
    if( geom ) {
      stream.write(JSON.stringify(parcels[key])+'\n');
    } else {
      tossing++;
    }
  };
  console.log('Done. tossed:'+tossing);
});


function onParcelStart() {
  process.stdout.write('Loading Parsels\n');
}
function onParcelUpdated(e) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write('Finding available parcels %'+e.percent);
}
function onParcelEnd() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log('Parcels loaded\n');
}