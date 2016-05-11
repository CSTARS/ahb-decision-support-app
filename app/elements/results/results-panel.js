var app = require('../app');
var sdk = require('../sdk');
var utils = require('../utils');
var datastore = sdk.datastore;

    Polymer({
      is: 'results-panel',

      ready : function() {
        this.breakdownRendered = false;
        this.charts = {};
        this.resizeTimer = -1;
        app.setOnCompleteListener(this.update.bind(this));
        app.on('poplar-price-update', this.onPriceRecalc.bind(this));
        $(window).on('resize', this.resize.bind(this));
      },

      resize : function() {
        if( this.resizeTimer !== -1 ) {
          clearTimeout(this.resizeTimer);
        }

        this.resizeTimer = setTimeout(function(){
          this.resizeTimer = -1;
          this._resize();
        }.bind(this), 100);
      },

      _resize : function() {
        var w = $(this).width();
        this.$.chart.style.width = w+'px';
        this.$.adoptionChart.style.width = w+'px';

        for( var key in this.charts ) {
          var c = this.charts[key];
          c.chart.draw(c.data, c.options);
        }
      },

      onShow : function() {
        this.resize();
      },

      update : function() {
        
        var url = `${window.location.protocol}//${window.location.host}/#l/${sdk.datastore.lat.toFixed(4)}/${sdk.datastore.lng.toFixed(4)}/${sdk.datastore.radius}/${encodeURIComponent(sdk.datastore.selectedRefinery.name)}`;
        this.$.runLink.setAttribute('href', url);
        this.$.runLink.innerHTML = url;
        
        //this.charts = {};
        this.$.parcelPercent.innerHTML = Math.floor(100 * ( sdk.datastore.selectedParcels.length / sdk.datastore.allParcels.length))+'%';
        this.$.validParcelPercent.innerHTML = Math.floor(100 * ( sdk.datastore.selectedParcels.length / sdk.datastore.validParcels.length))+'%';
        this.$.parcelCount.innerHTML = sdk.datastore.selectedParcels.length;
        
        this.$.farmersMWA.innerHTML = sdk.datastore.mwa;
        this.$.poplarPriceInput.value = sdk.datastore.poplarPrice;
        this.$.refineryMWP.innerHTML = datastore.mwp;

        var data = [
          ['Parcel Type', 'Parcel Number'],
          ['Adopted', sdk.datastore.selectedParcels.length],
          ['Not Adopted', sdk.datastore.validParcels.length - sdk.datastore.selectedParcels.length]
        ];


        data = google.visualization.arrayToDataTable(data);
        var options = {
          title: 'Adoption of Competing Parcels @ $'+sdk.datastore.poplarPrice+' / Mg',
          animation:{
            duration: 1000,
            easing: 'out',
          },
          height: 350
        };

        this.drawChart('overviewChart', data, options, this.$.overviewChart, 'PieChart');

        // render overview data
        var totals = sdk.datastore.totals;
        
        this.$.runtime.innerHTML = '('+totals.years+' Years)';
        this.$.acreCount.innerHTML = utils.formatAmount(totals.acres);
        var harvestTotal = utils.formatAmount(totals.harvested);
        this.$.harvestTotal.innerHTML = harvestTotal+' Mg';
        
        var yieldRequired = sdk.datastore.selectedRefinery.feedstockCapacity.value;
        var html = utils.formatAmount(totals.avgYearHarvest)+' Mg.<br /><span class="text ';
        if( totals.avgYearHarvest < yieldRequired ) {
          html += 'text-danger';
        } else {
          html += 'text-success';
        }
        html += '">'+utils.formatAmount(yieldRequired)+' Mg required to run refinery</span>';
        this.$.avgPerYear.innerHTML = html;
        
        // render refinery data
        var r = datastore.selectedRefinery;
        var years = datastore.poplarModel.monthsToRun / 12;
        
        var poplarCost = sdk.revenue.refinery.poplarCost(datastore, totals.harvested, datastore.poplarPrice);
        var refineryIncome = sdk.revenue.refinery.income(datastore, totals.harvested);
        var operatingCost = r.operatingCost.value * years;

        
        this.$.refineryType.innerHTML = r.name;
        this.$.refineryCapitalCost.innerHTML = '$'+utils.formatAmount(r.capitalCost);
        this.$.refineryOperatingCost.innerHTML = '$'+utils.formatAmount(operatingCost);
        this.$.refineryPoplarCost.innerHTML = '$'+utils.formatAmount(poplarCost);
        var totalCost = r.capitalCost + operatingCost + poplarCost;
        this.$.refineryTotalCost.innerHTML = '$'+utils.formatAmount(totalCost);
        this.$.refineryProduct.innerHTML = r.product.name;
        this.$.refineryIncome.innerHTML = '$'+utils.formatAmount(refineryIncome)+
                                           `<div class="help-block">
                                              (${r.yield.value} ${r.yield.units}) x
                                              (${r.product.price} ${r.product.units}) x
                                              (${harvestTotal} Mg)
                                           </div>`;
        
        var net = refineryIncome - (totalCost);
        var roi;
        if( totalCost > net ) {
          roi = 100 * (net / totalCost);
        } else {
          roi = 100 * (totalCost / net);
        }
         
        this.$.refineryRoi.innerHTML = '$'+utils.formatAmount(net)+'<br />  ROI: %'+roi.toFixed(0);

        data = [['Crop', 'Parcel Adoption']];
        for( var key in totals.cropCounts ) {
          data.push([key, totals.cropCounts[key]]);
        }

        data = google.visualization.arrayToDataTable(data);
        options = {
          title: 'Adoption By Crop @ $'+sdk.datastore.poplarPrice+' / Mg',
          animation:{
            duration: 1000,
            easing: 'out',
          },
          height: 350
        };

        this.drawChart('cropAdoption', data, options, this.$.chart, 'PieChart');

        this.$.adoptionAmount.innerHTML = ' @ $'+sdk.datastore.poplarPrice+' / Mg';

        this.updatePriceBreakdown();
      },

      drawChart : function(name, data, options, ele, type) {
        if( this.charts[name] ) {
          this.charts[name].chart.draw(data, options);
          this.charts[name].data = data;
          this.charts[name].options = options;
          return;
        }

        var chart = new google.visualization[type](ele);
        chart.draw(data, options);

        this.charts[name] = {
          chart : chart,
          data : data,
          options : options
        }
      },

      updatePriceBreakdown : function() {
        if( !this.breakdownRendered ) {
          this.breakdown = app.breakdown;
          this.renderBreakdown();
        } else {
          this.renderBreakdown();
        }
      },

      renderBreakdown : function() {
        var breakdown = this.breakdown;

        var dt = new google.visualization.DataTable();

        var data = [];
        var header = ['price'];
        dt.addColumn({id:'price', label: 'Price', type:'string'});

        for( var key in breakdown[0] ) {
          if( key === 'price' ) continue;
          header.push(key);
          dt.addColumn({id:key, label:key, type:'number'});
        }
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role:'tooltip'});

        var max = 0;
        var row;
        breakdown.forEach(function(pricedata){
          row = [];
          for( var i = 0; i < header.length; i++ ) {
            if( i === 0 ) {
              row.push(pricedata[header[i]]+'');
            } else {
              //var count = pricedata[header[i]] ? pricedata[header[i]].parcels : 0;
              var count = pricedata[header[i]] ? pricedata[header[i]].acres : 0;
              row.push(count);
              if( count > max ) {
                max = count;
              }
            }
          }
          
          if( pricedata.price === sdk.datastore.poplarPrice ) {
            row.push(max+20);
            row.push('Current Price: '+sdk.datastore.poplarPrice+' $ / Mg');
          } else {
            row.push(null);
            row.push(null);
          }
          
          data.push(row);
        });

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
            //title : 'Parcels (#)'
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

        this.drawChart('adoptionChart', dt, options, this.$.adoptionChart, 'ComboChart');

        this.breakdownRendered = true;
      },

      onPriceChange : function() {
        app.setPoplarPrice(parseFloat(this.$.poplarPriceInput.value));
      },
      
      onPriceRecalc : function() {
        this.breakdownRendered = false;
        this.update();
      },

      onPriceYieldChange : function(e) {
        e = e.detail;
        if( e.crop ) {
          sdk.datastore.priceYield.currentValues[e.crop][e.type][e.type] = e.value;
        }

        this.breakdownRendered = false;
        app.recalc();
      },

      setPoplarPrice : function(price) {
        this.$.poplarPriceInput.value = price;
      },

      showPriceYieldPopup : function() {
        this.$.priceYieldPopup.show();
      }
    });