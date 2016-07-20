var sdk = require('../../sdk');

Polymer({
  is: 'parcel-info-crop',

  render : function(budgetId, crop, fips, pasture) {
      var priceYield = sdk.collections.crops.getCropPriceAndYield(crop, fips);
      var budget = sdk.collections.budgets.get(budgetId);
      this.irrigationType = pasture ? 'non-irrigated' : 'irrigated';

      this.fips = fips;
      this.crop = crop;
      this.cost = budget.budget.total.toFixed(2);
      this.$.budgetLink.setAttribute('href', 'http://farmbudgets.org/#'+budget.id);

      this.price = priceYield.price.price;
      this.priceUnit = priceYield.price.unit;

      this.yield = priceYield.yield[this.irrigationType];
      this.yieldUnit = priceYield.yield.unit;
  }
});