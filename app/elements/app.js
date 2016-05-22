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
    
    this.recalc = function(callback) {
        if( !grown ) {
            if( callback ) callback();
            return;
        }
        
        // find optimal price $0 to $50, $1 step
        var options = {
            minPrice : 0,
            maxPrice : 150,
            step : 10,
            prescan : true
        };
        
        ee.emit('optimize-price-start');
        
        sdk.adoption.breakdown(options, (resp) => {
            options.minPrice = resp.poplarPrice - 11;
            options.maxPrice = resp.poplarPrice + 11;
            options.step = 2;
            
            sdk.adoption.breakdown(options, (resp) => {
                
                options = {
                    minPrice : resp.poplarPrice - 4,
                    maxPrice : resp.poplarPrice + 2,
                    step : 0.05
                };
                
                // now get detailed graph
                sdk.adoption.breakdown(options, (resp) => {
                    ee.emit('optimize-price-end');
                    
                    this.breakdown = resp.results;
                    datastore.setTotals();

                    this.getOnCompleteListeners().forEach(function(fn){
                        fn();
                    });

                    if( callback ) callback();
                });
            });
        });
    }

    this.run = function(options, callback) {

        // open a socket for transportation updates
        //var socket = io.connect('http://'+window.location.host);

        runConsole.onStart(options);

        var c = 0;
        var $self = this;
        function onComplete() {
            c++;
            if( c === 4 ) {
                grown = true;
                $self.recalc(() => {
                    //socket.disconnect();
                    runConsole.onEnd();
                    callback();
                });
            }
        }

        datastore.setSelectedRefinery(options.refinery);

        datastore.getParcels(options.lat, options.lng, options.radius, function(){
            datastore.getCrops(function(){
                
                //datastore.getTransportation(socket.id, onComplete.bind(this));
                var socket = datastore.getTransportation(onComplete.bind(this));
                runConsole.setTransportationSocket(socket);
                
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
        
        var options = {
            minPrice : price-2,
            maxPrice : price+2,
            step : 0.05,
            setPoplarPrice : false
        };
        
        sdk.adoption.breakdown(options, (resp) => {
            this.breakdown = resp.results;
            sdk.adoption.selectParcels();
            datastore.setTotals();
            ee.emit('poplar-price-update', price);
        });
    };
    
    this.getPoplarPrice = function() {
        return this.price || 24;
    };
}

module.exports = new App();