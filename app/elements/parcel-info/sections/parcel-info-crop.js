Polymer({
  is: 'parcel-info-crop',

  behaviors : [EventBusBehavior],

  render : function(budgetId, crop, fips, pasture) {
    this.getData(budgetId, crop, fips, (budget, priceYield) => {
      this.irrigationType = pasture ? 'non-irrigated' : 'irrigated';

      this.fips = fips;
      this.crop = crop;
      this.cost = budget.budget.total.toFixed(2);
      this.$.budgetLink.setAttribute('href', 'http://farmbudgets.org/#'+budget.id);

      this.price = priceYield.price.price;
      this.priceUnit = priceYield.price.unit;

      this.yield = priceYield.yield[this.irrigationType];
      this.yieldUnit = priceYield.yield.unit;
    });
  },

  getData : function(budgetId, crop, fips, callback) {
    this.getBudget(budgetId, (budget) => {
      this.getCropPriceAndYield(crop, fips, (priceYield) => {
        callback(budget, priceYield);
      });
    });
  },

  getBudget : function(id, handler) {
    this._eventBus.emit('get-budget', {id, handler});
  },

  getCropPriceAndYield : function(crop, fips, handler) {
    this._eventBus.emit('get-crop-price-yield', {crop, fips, handler});
  }
});