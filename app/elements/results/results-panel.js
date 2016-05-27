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
        
        var url = `${window.location.protocol}//${window.location.host}/#l/${sdk.datastore.lat.toFixed(4)}/${sdk.datastore.lng.toFixed(4)}/${sdk.datastore.radius}/${encodeURIComponent(sdk.datastore.selectedRefinery.name)}/${encodeURIComponent(sdk.poplarModel.selectedTree)}`;
        this.$.runLink.setAttribute('href', url);
        this.$.runLink.innerHTML = url;
        
        //this.charts = {};
        this.$.parcelPercent.innerHTML = Math.floor(100 * ( sdk.datastore.selectedParcels.length / sdk.datastore.allParcels.length))+'%';
        this.$.validParcelPercent.innerHTML = Math.floor(100 * ( sdk.datastore.selectedParcels.length / sdk.datastore.validParcels.length))+'%';
        this.$.parcelCount.innerHTML = sdk.datastore.selectedParcels.length;
        
        this.$.farmersMWA.innerHTML = sdk.datastore.mwa;
        this.$.poplarPriceInput.value = sdk.datastore.poplarPrice;
        this.$.refineryMWP.innerHTML = datastore.selectedRefinery.maxWillingToPay;

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
        this.$.avgYield.innerHTML = (totals.avgYearHarvest / totals.acres).toFixed(2)+' Mg';
        
        // render refinery data
        var r = datastore.selectedRefinery;
        var years = datastore.poplarModel.monthsToRun / 12;
        
        var poplarCost = sdk.revenue.refinery.poplarCost(datastore, totals.harvested, datastore.poplarPrice);
        var transportationCost = sdk.revenue.refinery.transportationCost(datastore);
        var refineryIncome = sdk.revenue.refinery.income(datastore, totals.years);
        var operatingCost = r.operatingCost.value * years;

        
        this.$.refineryType.innerHTML = r.name;
        this.$.refineryCapitalCost.innerHTML = '$'+utils.formatAmount(r.capitalCost);
        this.$.refineryOperatingCost.innerHTML = '$'+utils.formatAmount(operatingCost);
        this.$.refineryPoplarCost.innerHTML = '$'+utils.formatAmount(poplarCost);
        this.$.refineryTransportationCost.innerHTML = '$'+utils.formatAmount(transportationCost);
        var totalCost = r.capitalCost + operatingCost + poplarCost + transportationCost;
        this.$.refineryTotalCost.innerHTML = '$'+utils.formatAmount(totalCost);
        this.$.refineryProduct.innerHTML = r.product.name;
        this.$.refineryIncome.innerHTML = '$'+utils.formatAmount(refineryIncome)+
                                           `<div class="help-block">
                                              (${r.yield.value} ${r.yield.units}) x
                                              (${r.product.price} ${r.product.units}) x
                                              (${datastore.selectedRefinery.feedstockCapacity.value} Mg)
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
        
        var minPrice = 9999;
        var maxPrice = 0, p;
        
        for( var i = 0; i < breakdown.parcels.length; i++ ) {
          p = breakdown.parcels[i].properties.ucd.adoptionPrice;
          if( p < minPrice ) {
            minPrice = p;
          }
          if( p > maxPrice ) {
            maxPrice = p;
          }
        }
        
        minPrice = Math.floor(minPrice);
        maxPrice = Math.ceil(maxPrice);
        
        var crops = {};
        var priceData = [];
        var parcel, crop, item;
        
        for( var price = minPrice; price <= maxPrice; price += 0.5 ) {
          item = {
            price : price,
            poplar : {
              acres : 0,
              yield : 0
            }
          };
          priceData.push(item);
          
          for( var i = 0; i < breakdown.parcels.length; i++ ) {
            parcel = breakdown.parcels[i];
            
            if( price >= parcel.properties.ucd.adoptionPrice ) {
              item.poplar.acres += parcel.properties.usableSize;
              item.poplar.yield += parcel.properties.ucd.harvest.total / parcel.properties.ucd.harvest.years;
            } else {
              crop = parcel.properties.ucd.cropInfo.swap.join(', ');
              if( !crops[crop] ) {
                crops[crop] = 1;
              }
              if( !item[crop] ) {
                item[crop] = parcel.properties.usableSize;
              } else {
                item[crop] += parcel.properties.usableSize;
              }
            }

          }
        }
        
        var header = ['price', 'poplar'];
        for( var key in crops ) {
          header.push(key);
        }
        
        var data = [], row, rowData;
        var lastPrice = 0;
        var currentPriceNotSet = true;
        
        for( var j = 0; j < priceData.length; j++ ) {
          rowData = priceData[j];
          row = [rowData.price+'', rowData.poplar.acres];
          
          for( var i = 2; i < header.length; i++ ) {
            row.push(rowData[header[i]] || 0);
          }
          
          if( datastore.poplarPrice > lastPrice && datastore.poplarPrice <= rowData.price && currentPriceNotSet ) {
            currentPriceNotSet = false;
            row.push(rowData.poplar.acres);
            row.push('Current Price: '+sdk.datastore.poplarPrice+' $ / Mg');
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
        this.renderYieldAdoption(priceData);
      },
      
      renderYieldAdoption : function(priceData) {
        var breakdown = this.breakdown;

        var dt = new google.visualization.DataTable();

        var data = [];
        var header = ['price', 'poplar'];
        dt.addColumn({id:'price', label: 'Price', type:'string'});
        dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});


        var max = 0, lastPrice;
        var row, y, rowData;
        var currentPriceNotSet = true;
        
        for( var i = 0; i < priceData.length; i++ ) {
          rowData = priceData[i];
          row = [rowData.price+'', rowData.poplar.yield];
          
          if( datastore.poplarPrice > lastPrice && datastore.poplarPrice <= rowData.price && currentPriceNotSet ) {
            currentPriceNotSet = false;
            row.push(rowData.poplar.yield);
            row.push('Current Price: '+sdk.datastore.poplarPrice+' $ / Mg');
          } else {
            row.push(null);
            row.push(null);
          }
          
          data.push(row);
          lastPrice = rowData.price;
        }

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
            title : 'Total Yield'
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

        this.drawChart('renderYieldAdoption', dt, options, this.$.renderYieldAdoption, 'ComboChart');

        this.breakdownRendered = true;
      },

      /*renderBreakdown : function() {
        var breakdown = this.breakdown;

        var dt = new google.visualization.DataTable();

        var data = [];
        var header = ['price', 'poplar'];
        dt.addColumn({id:'price', label: 'Price', type:'string'});
        dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
        for( var key in breakdown[0].crops ) {
          header.push(key);
          dt.addColumn({id:key, label:key, type:'number'});
        }
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});

        var max = 0;
        var row;
        breakdown.forEach(function(result){
          row = [
            result.price+'',
            result.adopted.acres
          ];
          for( var i = 2; i < header.length; i++ ) {
            var count = result.crops[header[i]] ? result.crops[header[i]].acres : 0;
            row.push(count);
            
            if( count > max ) {
              max = count;
            }
          }
          
          if( result.price === sdk.datastore.poplarPrice ) {
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

        this.renderYieldAdoption();

        this.breakdownRendered = true;
      },
      
      renderYieldAdoption : function() {
        var breakdown = this.breakdown;

        var dt = new google.visualization.DataTable();

        var data = [];
        var header = ['price', 'poplar'];
        dt.addColumn({id:'price', label: 'Price', type:'string'});
        dt.addColumn({id:'poplar', label: 'Poplar', type:'number'});
        dt.addColumn({id:'Current Price', label:'Current Price', type:'number'});
        dt.addColumn({id: 'tooltip', type: 'string', role: 'tooltip'});


        var max = 0;
        var row, y;
        breakdown.forEach(function(result){
          y = result.adopted.yield / datastore.poplarModel.years;
          row = [
            result.price+'',
            y
          ];
          
          if( y > max ) {
            max = y;
          }

          if( result.price === sdk.datastore.poplarPrice ) {
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
            title : 'Total Yield'
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

        this.drawChart('renderYieldAdoption', dt, options, this.$.renderYieldAdoption, 'ComboChart');

        this.breakdownRendered = true;
      },*/
      
      

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
      },
      
      exportJson : function() {
        this.$.exportJsonFormData.value = JSON.stringify(sdk.datastore.exportJson());
        this.$.exportJsonForm.submit();
      }
    });