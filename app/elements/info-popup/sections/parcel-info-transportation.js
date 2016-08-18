var sdk = require('../../sdk');

Polymer({
  is: 'parcel-info-transportation',

  render : function(parcel, growthProfile) {
    var transportation = sdk.collections.transportation.get(parcel.properties.id);
    
    this.costAcre = parcel.properties.ucd.farmCost.poplar.avgTransportationCostPerYear.toFixed(2);
    this.costTon = (parcel.properties.ucd.farmCost.poplar.avgTransportationCostPerYear / (growthProfile.data.totalPerAcre / growthProfile.data.years)).toFixed(2);


    this.distance = transportation.distance.toFixed(2);
    this.distanceMi = (transportation.distance*0.621371).toFixed(2);

    this.duration = transportation.duration.toFixed(2);

    // details

    var collection = sdk.collections.transportation;
    this.truckLaborCost = collection.TRUCK_LABOR;
    this.driversPerTruck = collection.DRIVERS_PER_TRUCK;
    var labor = collection.DRIVERS_PER_TRUCK * collection.TRUCK_LABOR * transportation.duration;
    this.labor = labor.toFixed(2);

    this.milesPerGallon = collection.MILES_PER_GALLON;
    this.fuelCost = collection.FUEL_COST;
    var fuel = (1/collection.MILES_PER_GALLON) * collection.FUEL_COST * transportation.distance*0.621371;
    this.fuel = fuel.toFixed(2);
 
    this.oilOtherCost = collection.OIL_ETC_COST;
    this.tonsPerTruck = collection.getTonsPerTruck(collection.TRUCK_MATERIAL);

    var cost = collection.OIL_ETC_COST + fuel + labor;
    cost = 2 * (cost / this.tonsPerTruck);
    this.costPerTon = (cost).toFixed(2);

    var poplarYield = growthProfile.data.totalPerAcre / sdk.collections.growthProfiles.years;

    this.loading = sdk.models.transportation.getLoadingUnloadingCost().toFixed(2);

    this.conversion = collection.DRY_TON_TO_WET_TON;
    this.costPerAcre = (cost * collection.DRY_TON_TO_WET_TON * poplarYield + poplarYield).toFixed(2);
  },

  toggleDetails : function() {
    $(this.$.details).toggle('slow');
  }
});
