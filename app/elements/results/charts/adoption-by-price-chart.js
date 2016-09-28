var sdk = require('../../sdk');

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

  ready : function() {
    $(window).on('resize', () => {
      if( !this.chartInfo ) return;

      this.debounce('chartRender', () => {
        this.drawChart(this.chartInfo.data, this.chartInfo.options, this.chartInfo.type)
      }, 100);
    });
  },

  flipChart : function() {
    this.view = this.$.toggle.active ? 'yield' : 'price';
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

  renderPriceXAxis : function(priceData, crops) {
    var header = ['price', 'poplar'];
    for( var key in crops ) {
      header.push(key);
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

        for( var i = 2; i < header.length; i++ ) {
          row.push(null);
        }
        data.push(row);
      // }
      
      for( var i = 2; i < header.length; i++ ) {
        // if( lastYields[header[i]] !== (rowData[header[i]] || 0) ) {
          row = [rowData[header[i]] || 0];
          // lastYields[header[i]] = rowData[header[i]] || 0;

          for( var z = 1; z < i; z++ ) row.push(null); 
          row.push(rowData.price);
          for( var z = i+1; z < header.length; z++ ) row.push(null); 

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

    this.drawChart(dt, options, 'LineChart');
  },

  drawChart : function(data, options, type) {
    this.$.chart.innerHTML = '';

    var chart = new google.visualization[type](this.$.chart);
    chart.draw(data, options);

    this.chartInfo = {
      data : data,
      options : options,
      type : type
    }
  },

  renderYieldXAxis : function(priceData, crops) {
    var header = ['price', 'poplar'];
    for( var key in crops ) {
      header.push(key);
    }
    
    var data = [], row, rowData;
    var lastPrice = 0;
    var currentPriceNotSet = true;

    var refinery = sdk.collections.refineries.selected;
    
    for( var j = 0; j < priceData.length; j++ ) {
      rowData = priceData[j];
      row = [rowData.price+'', rowData.poplar.acres];
      
      for( var i = 2; i < header.length; i++ ) {
        row.push(rowData[header[i]] || 0);
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

    for( var i = 0; i < header.length-1; i++ ) {
      options.series[i] = {
        type : 'line',
        targetAxisIndex : 0
      }
    }

    this.drawChart(dt, options, 'ComboChart');
  }
});