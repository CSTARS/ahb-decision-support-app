var sdk = require('../../sdk');
var ChartBehavior = require('./ChartBehavior');

Polymer({
  is: 'adoption-by-price-chart',

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
    this.render(this.priceData, this.crops);
  },

  render : function(priceData, crops) {
    if( !priceData ) return;

    this.priceData = priceData;
    this.crops = crops;

    if( this.view === 'price' ) {
      this.renderPriceXAxis(priceData, crops);
    } else {
      this.renderYieldXAxis(priceData, crops);
    }
  },

  export : function() {
    if( !this.dataArray ) return;

    var filename = 'adoption-by-price.csv'

    var data = this.dataArray.map((row) => {
      return row.splice(0, row.length-2).join(',');
    });
    data.unshift(this.header.join(','));

    var blob = new Blob([data.join('\n')], {type: 'text/csv'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl =  ['text/csv', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  },

  renderPriceXAxis : function(priceData, crops) {
    this.header = ['price', 'poplar'];
    for( var key in crops ) {
      this.header.push(key);
    }
    
    var data = [], row, rowData;
    var currentPriceNotSet = true;

    var refinery = sdk.collections.refineries.selected;
    
    var lastYields = {};

    for( var j = priceData.length-1; j >= 0; j-- ) {
      rowData = priceData[j];

      // if( lastYields.poplar !== rowData.poplar.acres ) {
        row = [rowData.poplar.acres, rowData.price];
        // lastYields.poplar = rowData.poplar.acres;

        for( var i = 2; i < this.header.length; i++ ) {
          row.push(null);
        }
        data.push(row);
      // }
      
      for( var i = 2; i < this.header.length; i++ ) {
        // if( lastYields[header[i]] !== (rowData[header[i]] || 0) ) {
          row = [rowData[this.header[i]] || 0];
          // lastYields[header[i]] = rowData[header[i]] || 0;

          for( var z = 1; z < i; z++ ) row.push(null); 
          row.push(rowData.price);
          for( var z = i+1; z < this.header.length; z++ ) row.push(null); 

          data.push(row);

        // }
      }
    }


    // data.sort((a, b) => {
    //   if( a[0] > b[0] ) return 1;
    //   if( a[0] < b[0] ) return -1;
    //   return 0;
    // });

    var dt = new google.visualization.DataTable();
    
    dt.addColumn({id:'yield', label: 'yield', type:'number'});
    dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
    for( var key in crops ) {
      dt.addColumn({id:key, label:key, type:'number'});
    }
    
    this.dataArray = data;
    dt.addRows(data);
    
    var options = {
      vAxis : {
        title : 'Price ($)',
        viewWindowMode:'explicit',
        viewWindow: {
          max: priceData[priceData.length-1].price,
          min: priceData[0].price
        }
      },
      height: 400,
      hAxis : {
        title : 'Acres'
      },
      interpolateNulls : true,
      legend : {
        position: 'top'
      }
    }

    this.draw(dt, options, 'LineChart', this.$.chart);
  },

  renderYieldXAxis : function(priceData, crops) {
    this.header = ['price', 'poplar'];
    for( var key in crops ) {
      this.header.push(key);
    }
    
    var data = [], row, rowData;
    var lastPrice = 0;
    var currentPriceNotSet = true;

    var refinery = sdk.collections.refineries.selected;
    
    for( var j = 0; j < priceData.length; j++ ) {
      rowData = priceData[j];
      row = [rowData.price+'', rowData.poplar.acres];
      
      for( var i = 2; i < this.header.length; i++ ) {
        row.push(rowData[this.header[i]] || 0);
      }
      
      if( refinery.poplarPrice > lastPrice && refinery.poplarPrice <= rowData.price && currentPriceNotSet ) {
        currentPriceNotSet = false;
        row.push(rowData.poplar.acres);
        row.push('Current Price: '+refinery.poplarPrice+' $ / Mg');
      } else {
        row.push(null);
        row.push(null);
      }
      
      data.push(row);
      lastPrice = rowData.price;
    }
    
    var dt = new google.visualization.DataTable();
    dt.addColumn({id:'price', label: 'Price', type:'string'});
    dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
    for( var key in crops ) {
      dt.addColumn({id:key, label:key, type:'number'});
    }
    dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
    dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});
    
    this.dataArray = data;
    dt.addRows(data);
    
    var options = {
      animation:{
        duration: 1000,
        easing: 'out',
      },
      hAxis : {
        title : 'Price ($)'
      },
      height: 400,
      vAxis : {
        title : 'Acres'
      },
      seriesType: "bars",
      series :{},
      interpolateNulls : true,
      legend : {
        position: 'top'
      }
    }

    for( var i = 0; i < this.header.length-1; i++ ) {
      options.series[i] = {
        type : 'line',
        targetAxisIndex : 0
      }
    }

    this.draw(dt, options, 'ComboChart', this.$.chart);
  }
});