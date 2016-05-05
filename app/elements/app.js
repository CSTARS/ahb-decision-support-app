window.require = require;

var sdk = require('./sdk');
var events = require('events').EventEmitter;

var datastore = sdk.datastore;
var poplarModel = sdk.poplarModel;
var adoption = sdk.adoption;

function App() { 

    var listeners = [];
    var grown = false;
    var runConsole;
    var ee = new events();
    
    
    sdk.init(function(){
        console.log('budget loaded');
    });
    
    this.on = function(e, fn) {
        ee.on(e, fn);
    }
    
    this.setOnCompleteListener = function(fn) {
        listeners.push(fn);
    };
    
    this.getOnCompleteListeners = function() {
        return listeners;
    };
    
    this.registerRunConsole = function(rc) {
        runConsole = rc;
    }

    this.run = function(options, callback) {

        // open a socket for transportation updates
        var socket = io.connect('http://'+window.location.host);

        runConsole.onStart(options, socket);

        var c = 0;
        var $self = this;
        function onComplete() {
            c++;
            if( c === 4 ) {
                grown = true;

                //adoption.selectParcels();
                
                // find selected parcels at price $0 to $50, $1 step
                sdk.adoption.breakdown(0, 50, 1, (breakdown) => {
                    $self.breakdown = breakdown;
                    
                    datastore.setTotals();

                    $self.getOnCompleteListeners().forEach(function(fn){
                        fn();
                    });

                    socket.disconnect();
                    runConsole.onEnd();
                    callback();
                });
            }
        }

        datastore.setSelectedRefinery(options.refinery);

        datastore.getParcels(options.lat, options.lng, options.radius, function(){
            datastore.getCrops(function(){
                
                datastore.getTransportation(socket.id, onComplete.bind(this));
                datastore.getCropPriceAndYield(onComplete.bind(this));

                // run at the same time as transportation
                datastore.getWeather(function(weather){
                    datastore.getSoil(function(soil){
                        poplarModel.growAll(true, onComplete.bind(this));
                    });
                });

                datastore.getBudgets(onComplete.bind(this));

                if( datastore.errorFetchingCropTypes ) {
                    alert('Error fetching parcel crop types');
                }
           });
        });
    };
    
    this.setPoplarPrice = function(price) {
        datastore.poplarPrice = price;
        
        ee.emit('poplar-price-update', price);
        //if( this.grown ) {
        //    adoption.selectParcels();
        //    this.getOnCompleteListeners().forEach(function(fn){
        //        fn();
        //    });
        //}
    };
    
    this.getPoplarPrice = function() {
        return this.price || 24;
    };
}

module.exports = new App();