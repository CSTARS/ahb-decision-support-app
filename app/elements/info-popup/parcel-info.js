var sdk = require('../sdk');
var app = require('../app');

    Polymer({
      is: 'parcel-info',

      properties : {
        parcel : {
          type : Object,
          observer : 'onParcelUpdate'
        },
        parcelId : {
          type : String,
          reflectToAttribute : true
        }
      },

      onParcelUpdate : function() {
        if( !this.parcel ) return;
        this.parcelId = this.parcel.properties.PolyID;

        var name = ['Parcel ID: '+this.parcel.properties.PolyID];
        if( this.parcel.properties.SiteAddressFull && this.parcel.properties.SiteAddressFull.trim() ) {
          name.push(this.parcel.properties.SiteAddressFull);
        }
        if( this.parcel.properties.Township && this.parcel.properties.Township.trim() ) {
          name.push(this.parcel.properties.Township);
        }
        this.$.name.innerHTML = name.join(', ');

        this.$.size.innerHTML = Math.round(this.parcel.properties.GISAcres);
        this.$.potential.innerHTML = Math.floor(this.parcel.properties.PotentiallySuitPctOfParcel*100);
        this.$.asize.innerHTML = Math.round(this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel);
        
        this.$.adoptionPrice.innerHTML = '$'+this.parcel.properties.ucd.adoptionPrice.toFixed(2);

        var refinery = sdk.collections.refineries.selected;
        if( refinery.maxWillingToPay < this.parcel.properties.ucd.refineryGateCost ) {
          this.$.refineryGatePrice.innerHTML = '<span class="text text-danger">$'+this.parcel.properties.ucd.refineryGateCost.toFixed(2)+
                                          ' (Above refinery max willing to accept price of $'+refinery.maxWillingToPay.toFixed(2)+')</span>';
        } else {
          this.$.refineryGatePrice.innerHTML = '$'+this.parcel.properties.ucd.refineryGateCost.toFixed(2);
        }
        

        if( this.parcel.properties.ucd && this.parcel.properties.ucd.modelProfileId ) {
          this.onComplete();
        }
      },

      onComplete : function() {
        if( !this.parcel.properties.ucd.modelProfileId ) return;

        var refinery = sdk.collections.refineries.selected;
        var poplarTotal = this.parcel.properties.ucd.harvest.totalHarvest * refinery.poplarPrice;

        var label = 'success';
        if( poplarTotal < this.parcel.properties.ucd.crop.total ) {
          label = 'primary';
        } else {
          console.log('TODO');
          debugger;
        //  sdk.datastore.selectParcel(this.parcel);
        }

        setTimeout(this.updateChart.bind(this), 300);
      },

      updateChart : function() {
        if( !this.parcel.properties.ucd.modelProfileId ) return;

        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Year'); // Implicit domain label col.
        dt.addColumn('number', '$ Poplar');
        dt.addColumn({type: 'string', role: 'tooltip'});
        dt.addColumn('number', '$ Current Crop(s)');
        dt.addColumn({type: 'string', role: 'tooltip'});

        var id = this.parcel.properties.ucd.modelProfileId;
        var poplarConfig = sdk.poplarModel.profiles[id].config;
        if( !id ) return;
        var d = new Date(poplarConfig.manage.dateCoppiced.getTime());
        var startYear = d.getFullYear();

        var data = [];
        var c = 1;
        
        var size = this.parcel.properties.ucd.harvest.growArea;
        var poplarAveragePerYear = this.parcel.properties.ucd.harvest.total / this.parcel.properties.ucd.harvest.years;
        var poplarAveragePerAcre = poplarAveragePerYear / size;
        
        
        var income = this.parcel.properties.ucd.income;
        var cost = this.parcel.properties.ucd.farmCost;
        

        var revenueResults = this.parcel.properties.ucd.revenueResults;
        
        var stats = {
          poplarRevenue : 0,
          cropsRevenue : 0,
          transportation : {
            avg : 0,
            count : 0
          },
          water : {
            avg : 0,
            count : 0
          },
          land : {
            avg : 0,
            count : 0
          }
        }
        
        var cropIncome, cropCost, poplarIncome, poplarCost;
        for( var i = 0; i < cost.poplar.yearlyData.length; i++ ) {
          cropCost = cost.crops.yearlyData[i];
          poplarCost = cost.poplar.yearlyData[i];
          
          cropIncome = income.crops.yearly[i];
          poplarIncome = income.poplar.yearly[i];
          
          
          stats.poplarRevenue += poplarIncome - poplarCost.cost;
          stats.cropsRevenue += cropIncome - cropCost.cost;

          data.push([
            d.getFullYear()+'',
            stats.poplarRevenue,
            '$'+(stats.poplarRevenue).toFixed(2),
            stats.cropsRevenue,
            '$'+(stats.cropsRevenue).toFixed(2)
          ]);
          d.setFullYear(d.getFullYear()+1);

          if( poplarCost.transportation ) {
            stats.transportation.avg += poplarCost.transportation;
            stats.transportation.count++;
          }
          if( poplarCost.water ) {
            stats.water.avg += poplarCost.water;
            stats.water.count++;
          }
          if( poplarCost.land ) {
            stats.land.avg += poplarCost.land;
            stats.land.count++;
          }
        }

        if( stats.transportation.count > 0 ) {
          stats.transportation.avg  = stats.transportation.avg / stats.transportation.count;
        }
        if( stats.water.count > 0 ) {
          stats.water.avg  = stats.water.avg / stats.water.count;
        }
        if( stats.land.count > 0 ) {
          stats.land.avg  = stats.land.avg / stats.land.count;
        }

        dt.addRows(data);
        this.$.duration.innerHTML = (d.getFullYear()-startYear)+' Years';

        var html = '';
        var cropInfo = this.parcel.properties.ucd.cropInfo;
        for( var i = 0; i < cropInfo.swap.length; i++ ) {
          var priceYield = sdk.collections.crops.getCropPriceAndYield(cropInfo.swap[i]);
          
          html += '<b>'+cropInfo.swap[i] + '</b><br />'+
          '&nbsp;&nbsp;<b>Cost:</b> $'+cropInfo.cropBudgets[i].budget.total.toFixed(2)+' / Acre - <a href="http://farmbudgets.org/#' +
          cropInfo.cropBudgets[i].id+'" target="_blank"><i class="fa fa-list-alt"></i> Budget Details</a><br />' +
          '&nbsp;&nbsp;<b>Price:</b> '+priceYield.price.price+' '+priceYield.price.unit+'<br />'+
          '&nbsp;&nbsp;<b>Yield:</b> '+(priceYield.yield.yield)+' '+priceYield.yield.unit;
        }
        this.$.crops.innerHTML = html;

        if( this.parcel.properties.ucd.harvest.growthError ) {
          this.$.poplar.innerHTML = '<div class="alert alert-danger"><i class="fa fa-warning"></i> Failed to grow poplar :(</div>';
        } else {
          this.$.poplar.innerHTML =
                  '<b>Cost:</b> $'+sdk.collections.budgets.poplarTotal.toFixed(2)+' / Acre ' +
                  ' - <a href="http://farmbudgets.org/#'+sdk.budget.getPoplarBudget().getId()+'" target="_blank"><i class="fa fa-list-alt"></i> Budget Details</a></a><br />' +
                  '<b>Price:</b> $'+sdk.collections.refineries.selected.poplarPrice+' / Mg<br />'+
                  '<b>Water Cost:</b> $'+stats.water.avg.toFixed()+' / Acre / Year <br />'+
                  '<b>Land Cost:</b> $'+stats.land.avg.toFixed()+' / Acre / Year <br />'+
                  '<b>Avg Yield / Year:</b> '+poplarAveragePerYear.toFixed(2)+' Mg <br />'+
                  '<b>Avg Yield / Acre / Year:</b> '+poplarAveragePerAcre.toFixed(2)+' Mg <br />';
        }
        
        var size = this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel;
        
        this.$.transportation.innerHTML =
            '<b>Avg Transportation Cost / Acre:</b> $'+stats.transportation.avg.toFixed()+'<br />'+
            '<b>Avg Transportation Cost / Mg:</b> $'+(stats.transportation.avg / poplarAveragePerAcre).toFixed() +'<br />'+
            '<b>Distance:</b> '+(this.parcel.properties.ucd.transportation.distance*0.621371).toFixed(2)+' mi';

        var options = {
          width : $(this.$.revenueChart).parent().width(),
          height: 300,
          legend : {
            position: 'top'
          },
          hAxis : {
            slantedText:true,
            slantedTextAngle:45
          }
        };
        var chart = new google.visualization.LineChart(this.$.revenueChart);
        chart.draw(dt, options);

        setTimeout(function(){
          options.width = $(this.$.chart).parent().width();
          var chart = new google.visualization.LineChart(this.$.revenueChart);
          chart.draw(dt, options);
        }.bind(this), 500);

        this.updateYieldChart();
      },

      updateYieldChart : function() {
        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Year'); // Implicit domain label col.

        var id = this.parcel.properties.ucd.modelProfileId;
        var poplarConfig = sdk.poplarModel.profiles[id].config;
        if( !id ) return;

        this.drawPoplar();
      },
      
      drawPoplar : function() {
        var id = this.parcel.properties.ucd.modelProfileId;
        var alldata = sdk.poplarModel.profiles[id].allData;
        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Month');
        dt.addColumn('number', 'Poplar (Mg / Acre)');
        var data = [];
        for( var i = 0; i < alldata.length; i++ ) {
          if( typeof alldata[i][31] === 'string' ) {
            continue;
          }
          data.push([i+'', alldata[i][31] / 2.47105]);
        }
        dt.addRows(data);
        
        var options = {
          width : $(this.$.yieldChart).parent().width(),
          height: 300,
          legend : {
            position: 'top'
          },
          hAxis : {
            slantedText:true,
            slantedTextAngle:45
          }
        };
        var chart = new google.visualization.LineChart(this.$.poplarChart);
        chart.draw(dt, options);
        
        if( this.parcel.properties.ucd.cropInfo.pasture ) {
          this.$.irrigFrac.innerHTML = 'Not Irrigated: Pasture Land';
          this.$.irrigFrac.className = 'pull-right label label-warning';
        } else {
          this.$.irrigFrac.innerHTML = 'Irrigated';
          this.$.irrigFrac.className = 'pull-right label label-info';
        }
        
        setTimeout(function(){
          options.width = $(this.$.chart).parent().width();
          var chart = new google.visualization.LineChart(this.$.poplarChart);
          chart.draw(dt, options);
        }.bind(this), 500);
      },

      getYearData : function(cropInfo, yearData) {
        for( var i = 0; i < yearData.length; i++ ) {
          if( yearData[i].crop === cropInfo.crop ) {
            return yearData[i];
          }
        }

        return {
          crop : cropInfo.crop,
          yieldUnits : cropInfo.units,
          yield : 0
        }
      }
    });