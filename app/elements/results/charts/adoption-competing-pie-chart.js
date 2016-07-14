var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-competing-pie-chart',

  behaviors : [ChartBehavior],

  render : function(parcelCollection, refinery) {
    var data = [
      ['Parcel Type', 'Parcel Number'],
      ['Adopted', parcelCollection.selectedCount],
      ['Not Adopted', parcelCollection.validCount - parcelCollection.selectedCount]
    ];


    data = google.visualization.arrayToDataTable(data);
    var options = {
      title: 'Adoption of Competing Parcels @ $'+refinery.poplarPrice+' / Mg',
      animation:{
        duration: 1000,
        easing: 'out',
      },
      height: 350
    };

    this.style.width = this.parentElement.offsetWidth+'px';

    this.draw(data, options, 'PieChart', this);
    this.resize();
  }

});