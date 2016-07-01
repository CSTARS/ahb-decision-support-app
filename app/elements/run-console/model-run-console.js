var sdk = require('../sdk');
var app = require('../app');
var utils = require('../utils');


Polymer({
    is: 'model-run-console',

    ready : function() {
        app.registerRunConsole(this);

        this.lines = {};

        sdk.eventBus.on('transportation-update-start', this.onTransportationStart.bind(this));
        sdk.eventBus.on('transportation-update-end', this.onTransportationEnd.bind(this));
        sdk.eventBus.on('transportation-update', this.onTransportationUpdate.bind(this));

        sdk.eventBus.on('weather-update-start', this.onWeatherStart.bind(this));
        sdk.eventBus.on('weather-update-end', this.onWeatherEnd.bind(this));

        sdk.eventBus.on('soil-update-start', this.onSoilStart.bind(this));
        sdk.eventBus.on('soil-update-end', this.onSoilEnd.bind(this));

        sdk.eventBus.on('parcels-update-start', this.onParcelStart.bind(this));
        sdk.eventBus.on('parcels-update-updated', this.onParcelUpdated.bind(this));
        sdk.eventBus.on('parcels-update-end', this.onParcelEnd.bind(this));

        sdk.eventBus.on('crops-update-start', this.onCropsStart.bind(this));
        sdk.eventBus.on('crops-update-updated', this.onCropsUpdated.bind(this));
        sdk.eventBus.on('crops-update-end', this.onCropsEnd.bind(this));

        sdk.eventBus.on('crop-priceyield-update-start', this.onCropPriceYieldStart.bind(this));
        sdk.eventBus.on('crop-priceyield-update-end', this.onCropPriceYieldEnd.bind(this));

        sdk.eventBus.on('budgets-update-start', this.onBudgetsStart.bind(this));
        sdk.eventBus.on('budgets-update-end', this.onBudgetsEnd.bind(this));

        sdk.eventBus.on('harvests-start', this.onHarvestsStart.bind(this));
        sdk.eventBus.on('harvests-updated', this.onHarvestsUpdated.bind(this));
        sdk.eventBus.on('harvests-end', this.onHarvestsEnd.bind(this));
    },

    onStart : function(options) {
        this.startTime = new Date().getTime();
        this.innerHTML = '';
        this.style.display = 'block';
        
        var lat = options.lat.toFixed(4);
        var lng = options.lng.toFixed(4);
        var r = options.radius / 1000;
        
        this.createLine('start', `Starting run for ${options.refinery} refinery @ ${lat}, ${lat} Radius: ${r}`);
    },

    onEnd : function() {
        this.createLine('end', 'Finished. Execution Time: '+((new Date().getTime() - this.startTime) / 1000).toFixed(2)+'s');
        
        var yieldRequired = sdk.datastore.selectedRefinery.feedstockCapacity.value;
        var ayield = sdk.datastore.totals.avgYearHarvest;
        
        if( ayield < yieldRequired ) {
            this.createLine('warning', 
                `The current run only produced ${utils.formatAmount(ayield)} Mg/Year or Poplar.  ${utils.formatAmount(yieldRequired)} Mg/Year is required for the selected refinery`,
                'text text-danger','<i class="fa fa-warning"></i>');
        }
    },

    onHarvestsStart : function() {
        this.createLine('harvest', 'Growing Poplar %0','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onHarvestsUpdated : function(e) {
        this.updateLine('harvest', 'Growing Poplar %'+e.percent);
    },

    onHarvestsEnd : function() {
        this.updateLine('harvest', 'Poplar grown','text text-success','<i class="fa fa-check"></i>');
    },

    onParcelStart : function() {
        this.createLine('parcel', 'Finding available parcels','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onParcelUpdated : function(e) {
        this.updateLine('parcel', 'Finding available parcels %'+e.percent);
    },

    onParcelEnd : function(e) {
    // currently parcel count is not available at this point.  TODO: fix this
        this.updateLine('parcel', 'Parcels loaded. ','text text-success','<i class="fa fa-check"></i>');
    //    this.updateLine('parcel', 'Parcels loaded. '+e.length,'text text-success','<i class="fa fa-check"></i>');
    },

    onTransportationStart : function() {
        this.createLine('transportation', 'Looking up transportation routes %0','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onTransportationUpdate : function(e) {
        this.updateLine('transportation', 'Looking up transportation routes %' +
        e.percent+' (~'+(e.timeRemaining/1000).toFixed(2)+'s @ '+e.averageTime.toFixed(2)+'ms/route)');
    },

    onTransportationEnd : function() {
        this.updateLine('transportation', 'Transportation routes loaded','text text-success','<i class="fa fa-check"></i>');
    },

    onCropsStart : function() {
        this.createLine('crops', 'Looking up crop type for parcels.','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onCropsUpdated : function(e) {
        this.updateLine('crops', 'Looking up crop type for parcels %'+e.percent);
    },

    onCropsEnd : function() {
        var total = sdk.datastore.allParcels.length;
        var valid = sdk.datastore.validParcelsCount;
        this.updateLine('crops', 'Crop type loaded. '+valid+' of '+total+' parcels have competing crops.','text text-success','<i class="fa fa-check"></i>');
    },

    onCropPriceYieldStart : function() {
        this.createLine('cropPriceYield', 'Looking up crop price and yield','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onCropPriceYieldEnd : function() {
        this.updateLine('cropPriceYield', 'Crop price and yield loaded.','text text-success','<i class="fa fa-check"></i>');
    },
    
    onBudgetsStart : function() {
        this.createLine('budget', 'Looking up farm budgets from farmbudgets.org','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onBudgetsEnd : function() {
        this.updateLine('budget', 'Farm budgets loaded','text text-success','<i class="fa fa-check"></i>');
    },

    onWeatherStart : function() {
        this.createLine('weather', 'Loading weather data','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onWeatherEnd : function() {
        this.updateLine('weather', 'Weather loaded','text text-success','<i class="fa fa-check"></i>');
    },

    onSoilStart : function() {
        this.createLine('soil', 'Loading soil data','text text-warning','<i class="fa fa-spin fa-circle-o-notch"></i>');
    },

    onSoilEnd : function() {
        this.updateLine('soil', 'Soil loaded','text text-success','<i class="fa fa-check"></i>');
    },

    createLine : function(id, msg, className, icon) {
        var line = document.createElement('module-run-console-line');
        line.setText(msg);
        line.setIcon(icon);
        if( className !== undefined ) {
            line.className = className;
        }


        this.lines[id] = line;
        this.appendChild(line);
    },

    updateLine : function(id, msg, className, icon) {
        if( !this.lines[id] ) {
            return;
        }

        var line = this.lines[id];

        line.setText(msg);
        line.setIcon(icon);

        if( className !== undefined ) {
            line.className = className;
        }
    }
});
