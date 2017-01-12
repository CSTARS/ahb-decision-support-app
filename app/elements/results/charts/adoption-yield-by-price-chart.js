var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-yield-by-price-chart',

  properties : {
    view : {
      type : String,
      value : 'price'
    },
    flipped : {
      type : Boolean,
      value : false,
      observer : 'flipChart'
    }
  },

  behaviors : [ChartBehavior],

  flipChart : function() {
    this.view = this.$.toggle.active ? 'price' : 'yield';
    this.render(this.priceData);
  },

  render : function(priceData, refinery, growthTime) {
    if( !priceData ) return;

    this.priceData = priceData;
    if( this.view === 'price' ) {
      this.renderPriceXAxis(priceData, refinery, growthTime);
    } else {
      this.renderYieldXAxis(priceData, refinery, growthTime);
    }
  },

  export : function() {
    if( !this.dataArray ) return;

    var filename = 'adoption-yield-by-price.csv'

    var data = this.dataArray.map((row) => {
      return row.splice(0, 2).join(',');
    });
    data.unshift(['price', 'poplar'].join(','));

    var blob = new Blob([data.join('\n')], {type: 'text/csv'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl =  ['text/csv', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  },

  renderPriceXAxis : function(priceData, refinery, growthTime) {
    var dt = new google.visualization.DataTable();

    var data = [];

    var header = ['price', 'poplar'];
    dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
    dt.addColumn({id:'price', label: 'Price', type:'number'});
    dt.addColumn({id:'currentPrice', label: 'Current Price', type:'number'});


    var max = 0, lastYield, yieldAmount;
    var row, y, rowData;
    var currentPriceNotSet = true;
    var yieldRequired = refinery.feedstockCapacity.value;

    for( var i = 0; i < priceData.length; i++ ) {
      rowData = priceData[i];
      yieldAmount = rowData.poplar.yield / growthTime;
      if( lastYield === yieldAmount ) {
        continue;
      }

      row = [yieldAmount, rowData.price];

      if( refinery.poplarPrice > rowData.price ) {
        row.push(refinery.poplarPrice);
      } else {
        row.push(null);
      }
        
      data.push(row);
      lastYield = yieldAmount;
    }

    dt.addRows(data);
    this.dataArray = data;

    var options = {
      vAxis : {
        title : 'Price ($)'
      },
      height: 400,
      hAxis : {
        title : 'Average Yield / Year'
      },
      interpolateNulls : false,
      legend : {
        position: 'top'
      }
    }


    this.draw(dt, options, 'LineChart', this.$.chart);
  },

  renderYieldXAxis : function(priceData, refinery, growthTime) {
    var dt = new google.visualization.DataTable();

      var data = [];
      var header = ['price', 'poplar', 'required'];
      // data.push(header);


      dt.addColumn({id:'price', label: 'Price', type:'string'});
      dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
      
      dt.addColumn({id: 'required', label: 'Required Yield', type: 'number'});
      dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
      dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});


      var max = 0, lastPrice;
      var row, y, rowData;
      var currentPriceNotSet = true;
      var yieldRequired = refinery.feedstockCapacity.value;
      
      for( var i = 0; i < priceData.length; i++ ) {
        rowData = priceData[i];
        row = [rowData.price+'', rowData.poplar.yield / growthTime, yieldRequired];
 
        if( refinery.poplarPrice > lastPrice && refinery.poplarPrice <= rowData.price && currentPriceNotSet ) {
          currentPriceNotSet = false;
          row.push(rowData.poplar.yield / growthTime);
          row.push('Current Price: '+refinery.poplarPrice+' $ / Mg');
        } else {
          row.push(null);
          row.push(null);
        }
        
        data.push(row);
        lastPrice = rowData.price;
      }

      dt.addRows(data);
      this.dataArray = data;

      var options = {
        hAxis : {
          title : 'Price ($)'
        },
        height: 400,
        vAxis : {
          title : 'Average Yield / Year'
        },
        seriesType: "bars",
        series :{},
        interpolateNulls : true,
        legend : {
          position: 'top'
        }
      }

      for( var i = 0; i < header.length-1; i++ ) {
        options.series[i] = {
          type : 'line',
          targetAxisIndex : 0
        }
      }

      this.draw(dt, options, 'ComboChart', this.$.chart);
  }
});