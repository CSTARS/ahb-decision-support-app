var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-competing-pie-chart',

  behaviors : [ChartBehavior],

  render : function(parcelSummary, refinery) {
    var data = [
      ['Parcel Type', 'Parcel Number'],
      ['Adopted', parcelSummary.selectedCount],
      ['Not Adopted', parcelSummary.validCount - parcelSummary.selectedCount]
    ];

    this.$.title.innerHTML = 'Adoption of Competing Parcels @ $'+refinery.poplarPrice+' / Mg';

    data = google.visualization.arrayToDataTable(data);
    var options = {
      height: 350
    };

    this.draw(data, options, 'PieChart', this.$.chart);
    this.resize();
  }

});