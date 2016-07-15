window.require = require;

var sdk = require('./sdk');
var events = require('events').EventEmitter;


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
        //options.setPoplarPrice = 94;

        runConsole.onStart(options);

        sdk.controllers.refinery.model(options, () => {
            this.getOnCompleteListeners().forEach(function(fn){
                fn();
            });

            if( callback ) callback();
        });
    }
    
    this.setPoplarPrice = function(price) {
        var options = {
            setPoplarPrice : price
        }

        sdk.controllers.refinery.optimize(options);
    };
    
    this.getPoplarPrice = function() {
        return this.price || 24;
    };
}

module.exports = new App();