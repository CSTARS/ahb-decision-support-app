var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-crop-pie-chart',

  behaviors : [ChartBehavior],

  render : function(totals, refinery) {
    var data = [['Crop', 'Parcel Adoption']];

    for( var key in totals.cropCounts ) {
      data.push([key, totals.cropCounts[key]]);
    }

    this.$.title.innerHTML = 'Adoption By Crop @ $'+refinery.poplarPrice+' / Mg';

    data = google.visualization.arrayToDataTable(data);
    var options = {
      height: 350
    };

    // this.style.width = this.parentElement.offsetWidth+'px';

    this.draw(data, options, 'PieChart', this.$.chart);
    this.resize();
  }


});