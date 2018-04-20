Polymer({
  is: 'parcel-info-poplar',

  behaviors : [EventBusBehavior],

  render : function(parcel, growthProfile) {
    if( growthProfile.growthError ) {
      this.$.growthError.style.display = 'block';
      this.$.details.style.display = 'none';
      return;
    }

    this.$.growthError.style.display = 'none';
    this.$.details.style.display = 'block';

    this.getData(parcel.properties.ucd.poplarBudgetId, (poplarBudget, growthTimeInYears) => {
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

      var poplarYield = growthProfile.data.totalPerAcre / growthTimeInYears;
      this.poplarYield = poplarYield.toFixed(2);
      this.totalPoplarYield = (poplarYield * parcel.properties.usableSize).toFixed(2);
    });
  },

  getData : function(budgetId, callback) {
    this.getBudget(budgetId, (budget) => {
      this.getGrowthTime((years) => {
        callback(budget, years);
      });
    });
  },

  getBudget : function(id, handler) {
    this.getEventBus().emit('get-budget', {id, handler});
  },

  getGrowthTime : function(handler) {
    this.getEventBus().emit('get-growth-time', {handler});
  }
});