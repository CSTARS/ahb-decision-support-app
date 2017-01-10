var sdk = require('../../sdk');

Polymer({
  is: 'parcel-info-poplar',

  render : function(parcel, growthProfile) {
    if( growthProfile.growthError ) {
      this.$.growthError.style.display = 'block';
      this.$.details.style.display = 'none';
      return;
    }

    this.$.growthError.style.display = 'none';
    this.$.details.style.display = 'block';

    var poplarBudget = sdk.collections.budgets.getPoplarBudget(parcel.properties.ucd.poplarBudgetId);
    this.cost = poplarBudget.total.toFixed(2);
    this.$.budgetDetailsLink.setAttribute('href', 'http://farmbudgets.org/#'+parcel.properties.ucd.poplarBudgetId);

    var water = 0;
    var land = 0;
    var yd;
    for( var i = 0; i < parcel.properties.ucd.farmCost.poplar.yearlyData.length; i++ ) {
      yd = parcel.properties.ucd.farmCost.poplar.yearlyData[i];
      water += yd.water;
      land += yd.land;
    }

    this.waterCost = (water / growthProfile.data.years).toFixed(2);
    this.landCost = (land / growthProfile.data.years).toFixed(2);

    var poplarYield = growthProfile.data.totalPerAcre / sdk.collections.growthProfiles.years;
    this.poplarYield = poplarYield.toFixed(2);
    this.totalPoplarYield = (poplarYield * parcel.properties.usableSize).toFixed(2);
  }
});