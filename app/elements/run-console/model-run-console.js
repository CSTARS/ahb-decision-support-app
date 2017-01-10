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

        sdk.eventBus.on('results-summary-start', this.onSummaryStart.bind(this));
        sdk.eventBus.on('results-summary-end', this.onSummaryEnd.bind(this));

        sdk.eventBus.on('optimize-start', this.onOptimizeStart.bind(this));
        sdk.eventBus.on('optimize-update', this.onOptimizeUpdate.bind(this));
        sdk.eventBus.on('optimize-end', this.onOptimizeEnd.bind(this));

        sdk.eventBus.on('harvests-start', this.onHarvestsStart.bind(this));
        sdk.eventBus.on('harvests-updated', this.onHarvestsUpdated.bind(this));
        sdk.eventBus.on('harvests-end', this.onHarvestsEnd.bind(this));

        sdk.eventBus.on('refinery-model-run-complete', this.onEnd.bind(this));
    },

    onStart : function(options) {
        this.startTime = new Date().getTime();
        this.$.console.innerHTML = '';
        this.style.display = 'block';
        this.$.resultsBtn.style.display = 'none';

        var lat = options.lat.toFixed(4);
        var lng = options.lng.toFixed(4);
        var r = options.radius / 1000;
        
        this.createLine('start', `Starting run for ${options.refinery} refinery @ ${lat}, ${lng} Radius: ${r}`);
    },

    onEnd : function() {
        this.createLine('end', 'Finished. Execution Time: '+((new Date().getTime() - this.startTime) / 1000).toFixed(2)+'s');

        var yieldRequired = sdk.collections.refineries.selected.feedstockCapacity.value;
        var ayield = sdk.collections.parcels.summary.avgYearHarvest;
        
        if( ayield < yieldRequired ) {
            this.createLine('warning', 
                `The current run only produced ${utils.formatAmount(ayield)} Mg/Year of Poplar.  ${utils.formatAmount(yieldRequired)} Mg/Year is required for the selected refinery`,
                'text text-danger','<i class="fa fa-warning"></i>');
        }

        this.$.resultsBtn.style.display = 'inline-block';
    },

    goToResults : function() {
        window.location.hash = '#results';
    },

    onHarvestsStart : function() {
        this.createLine('harvest', 'Growing Poplar %0','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onHarvestsUpdated : function(e) {
        this.updateLine('harvest', 'Growing Poplar %'+e.percent);
    },

    onHarvestsEnd : function() {
        this.updateLine('harvest', 'Poplar grown.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onParcelStart : function() {
        this.createLine('parcel', 'Finding available parcels','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onParcelUpdated : function(e) {
        this.updateLine('parcel', 'Finding available parcels %'+e.percent);
    },

    onParcelEnd : function(e) {
    // currently parcel count is not available at this point.  TODO: fix this
        this.updateLine('parcel', 'Parcels loaded. ','highlight','<iron-icon icon="check"></iron-icon>');
    //    this.updateLine('parcel', 'Parcels loaded. '+e.length,'highlight','<iron-icon icon="check"></iron-icon>');
    },

    onTransportationStart : function() {
        this.createLine('transportation', 'Looking up transportation routes %0','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onTransportationUpdate : function(e) {
        this.updateLine('transportation', 'Looking up transportation routes %' +
        e.percent+' (~'+(e.timeRemaining/1000).toFixed(2)+'s @ '+e.averageTime.toFixed(2)+'ms/route)');
    },

    onTransportationEnd : function() {
        this.updateLine('transportation', 'Transportation routes loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onCropsStart : function() {
        this.createLine('crops', 'Looking up crop type for parcels.','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onCropsUpdated : function(e) {
        this.updateLine('crops', 'Looking up crop type for parcels %'+e.percent);
    },

    onCropsEnd : function() {
        this.updateLine('crops', 'Crop type loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onCropPriceYieldStart : function() {
        this.createLine('cropPriceYield', 'Looking up crop price and yield','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onCropPriceYieldEnd : function() {
        this.updateLine('cropPriceYield', 'Crop price and yield loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },
    
    onBudgetsStart : function() {
        this.createLine('budget', 'Looking up farm budgets from farmbudgets.org','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onBudgetsEnd : function() {
        this.updateLine('budget', 'Farm budgets loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onSummaryStart : function() {
        this.createLine('summary', 'Summarizing results','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onSummaryEnd : function() {
        this.updateLine('summary', 'Results summarized.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onOptimizeStart : function() {
        this.createLine('optimize', 'Calulating price','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onOptimizeUpdate : function(e) {
        this.updateLine('optimize', 'Calulating price %'+ (e*100).toFixed(0));
    },

    onOptimizeEnd : function() {
        this.updateLine('optimize', 'Optimal price calculated.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onWeatherStart : function() {
        this.createLine('weather', 'Loading weather data','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" style="width:24px;height:24px" active></paper-spinner-lite>');
    },

    onWeatherEnd : function() {
        this.updateLine('weather', 'Weather loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    onSoilStart : function() {
        this.createLine('soil', 'Loading soil data','text text-warning','<paper-spinner-lite style="color: orange;width:24px;height:24px" active></paper-spinner-lite>');
    },

    onSoilEnd : function() {
        this.updateLine('soil', 'Soil loaded.','highlight','<iron-icon icon="check"></iron-icon>');
    },

    createLine : function(id, msg, className, icon) {
        var line = document.createElement('module-run-console-line');
        line.setText(msg);
        line.setIcon(icon);
        if( className !== undefined ) {
            line.setClassName(className);
        }

        this.lines[id] = line;
        Polymer.dom(this.$.console).appendChild(line);

        this.fire('line-added');
    },

    updateLine : function(id, msg, className, icon) {
        if( !this.lines[id] ) {
            return;
        }

        var line = this.lines[id];

        line.setText(msg);
        line.setIcon(icon);
        if( className !== undefined ) {
            line.setClassName(className);
        }
    }
});
