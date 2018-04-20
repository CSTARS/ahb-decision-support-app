Polymer({
  is: 'parcel-info-transportation',

  behaviors : [EventBusBehavior],

  properties : {
    detailsVisible : {
      type : Boolean,
      value : false
    }
  },

  render : function(parcel, growthProfile) {
    this.getData(parcel.properties.id, (transportationRoute, transportationDefaults, growthTime, loadingUnloadingCost) => {    
      this.costAcre = parcel.properties.ucd.farmCost.poplar.avgTransportationCostPerYear.toFixed(2);
      this.costTon = (parcel.properties.ucd.farmCost.poplar.avgTransportationCostPerYear / (growthProfile.data.totalPerAcre / growthProfile.data.years)).toFixed(2);

      this.distance = transportationRoute.distance.toFixed(2);
      this.distanceMi = (transportationRoute.distance*0.621371).toFixed(2);

      this.duration = transportationRoute.duration.toFixed(2);

      // details
      this.truckLaborCost = transportationDefaults.TRUCK_LABOR;
      this.driversPerTruck = transportationDefaults.DRIVERS_PER_TRUCK;
      var labor = transportationDefaults.DRIVERS_PER_TRUCK * transportationDefaults.TRUCK_LABOR * transportationRoute.duration;
      this.labor = labor.toFixed(2);

      this.milesPerGallon = transportationDefaults.MILES_PER_GALLON;
      this.fuelCost = transportationDefaults.FUEL_COST;
      var fuel = (1/transportationDefaults.MILES_PER_GALLON) * transportationDefaults.FUEL_COST * transportationRoute.distance*0.621371;
      this.fuel = fuel.toFixed(2);
  
      this.oilOtherCost = transportationDefaults.OIL_ETC_COST;

      this.getTonsPerTruck(transportationDefaults.TRUCK_MATERIAL, (tonsPerTruck) => {
        this.tonsPerTruck = tonsPerTruck;

        var cost = transportationDefaults.OIL_ETC_COST + fuel + labor;
        cost = 2 * (cost / this.tonsPerTruck);
        this.costPerTon = (cost).toFixed(2);

        var poplarYield = growthProfile.data.totalPerAcre / growthTime;

        this.loading = loadingUnloadingCost.toFixed(2);

        this.conversion = transportationDefaults.DRY_TON_TO_WET_TON;
        this.costPerAcre = (cost * transportationDefaults.DRY_TON_TO_WET_TON * poplarYield + poplarYield).toFixed(2);
      });
    });
  },

  toggleDetails : function() {
    this.detailsVisible = !this.detailsVisible;
    this.$.details.style.display = this.detailsVisible ? 'block' : 'none';
  },

  getData : function(parcelId, callback) {
    this.ebChain(
      [
        {event : 'get-transportation-route', payload : {id: parcelId}},
        {event : 'get-transportation-defaults'},
        {event : 'get-growth-time'},
        {event : 'get-transportation-loading-unloading-cost'}
      ],
      (results) => {
        callback.apply(this, results);
      }
    );
  },

  getTonsPerTruck : function(material, handler) {
    this.getEventBus().emit('get-transportation-tons-per-truck', {material, handler});
  }
});
