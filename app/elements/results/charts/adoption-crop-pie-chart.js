var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-crop-pie-chart',

  behaviors : [ChartBehavior],

  render : function(totals, refinery) {
    var data = [['Crop', 'Parcel Adoption']];

    for( var key in totals.cropCounts ) {
      data.push([key, totals.cropCounts[key]]);
    }

    data = google.visualization.arrayToDataTable(data);
    var options = {
      title: 'Adoption By Crop @ $'+refinery.poplarPrice+' / Mg',
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