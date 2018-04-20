

    Polymer({
      is: 'parcel-info',

      properties : {
        active : {
          type : Boolean,
          observer : 'onShow'
        }
      },

      behaviors : [EventBusBehavior],

      onShow : function() {
        if( !this.active ) return;

        var id = window.location.hash.split('/')[1];
        this.getData(id, (parcel, growthProfile, refinery) => {
          this.growthProfile = growthProfile;
          this.parcel = parcel;
          this.refinery = refinery;

          this.render();
        });
      },

      back : function() {
        window.location.hash = '#map';
      },

      render : function() {
        if( !this.parcel ) return;
        this.parcelId = this.parcel.properties.id;

        this.$.adopted.style.display = this.parcel.properties.ucd.selected ? 'block' : 'none';

        var name = ['Parcel ID: '+this.parcel.properties.id];
        if( this.parcel.properties.SiteAddressFull && this.parcel.properties.SiteAddressFull.trim() ) {
          name.push(this.parcel.properties.SiteAddressFull);
        }
        if( this.parcel.properties.Township && this.parcel.properties.Township.trim() ) {
          name.push(this.parcel.properties.Township);
        }
        this.$.name.innerHTML = name.join(', ');

        this.$.pastureLandIgnored.style.display = this.parcel.properties.ucd.pastureIgnored ? 'block' : 'none';

        this.$.size.innerHTML = Math.round(this.parcel.properties.GISAcres);
        this.$.potential.innerHTML = Math.floor(this.parcel.properties.PotentiallySuitPctOfParcel*100);
        this.$.asize.innerHTML = Math.round(this.parcel.properties.GISAcres * this.parcel.properties.PotentiallySuitPctOfParcel);
        this.$.refineryPrice.innerHTML = this.refinery.poplarPrice.toFixed(2);
        this.$.adoptionPrice.innerHTML = this.parcel.properties.ucd.adoptionPrice.toFixed(2);



        if( this.refinery.maxWillingToPay < this.parcel.properties.ucd.refineryGateCost ) {
          this.$.refineryGatePrice.innerHTML = '<span class="text text-danger">$'+this.parcel.properties.ucd.refineryGateCost.toFixed(2)+
                                          ' (Above refinery max willing to accept price of $'+this.refinery.maxWillingToPay.toFixed(2)+')</span>';
        
          this.$.refineryGatePriceIcon.style.backgroundColor = this.getOverRgba();
        } else {
          this.$.refineryGatePrice.innerHTML = this.parcel.properties.ucd.refineryGateCost.toFixed(2);

          this._getRefineryGatePrice((refineryGatePrice) => {
            this.prices = refineryGatePrice;
            this.$.refineryGatePriceIcon.style.backgroundColor = this.getRgbaFromPrice(this.parcel.properties.ucd.refineryGateCost);
          });
        }
        

        if( this.parcel.properties.ucd && this.parcel.properties.ucd.modelProfileId ) {
          this.onComplete();
        }
      },

      onComplete : function() {
        if( !this.parcel.properties.ucd.modelProfileId ) return;

        var poplarTotal = this.parcel.properties.usableSize * this.growthProfile.data.totalPerAcre * this.refinery.poplarPrice;

        var label = 'success';
        if( poplarTotal < this.parcel.properties.ucd.adoptionPrice ) {
          label = 'primary';
        }

        setTimeout(this.updateChart.bind(this), 300);
      },

      updateChart : function() {

        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Year'); // Implicit domain label col.
        dt.addColumn('number', '$ Poplar');
        dt.addColumn({type: 'string', role: 'tooltip'});
        dt.addColumn('number', '$ Current Crop(s)');
        dt.addColumn({type: 'string', role: 'tooltip'});

        var poplarConfig = this.growthProfile.config;

        var d = new Date(poplarConfig.manage.dateCoppiced);
        var startYear = d.getFullYear();

        var data = [];
        var c = 1;
        
        var income = this.parcel.properties.ucd.income;
        var cost = this.parcel.properties.ucd.farmCost;

        var revenueResults = this.parcel.properties.ucd.revenueResults;
        
        var stats = {
          poplarRevenue : 0,
          cropsRevenue : 0
        }


        var cropIncome, cropCost, poplarIncome, poplarCost;
        for( var i = 0; i < cost.poplar.yearlyData.length; i++ ) {
          cropCost = cost.crops.yearlyData[i];
          poplarCost = cost.poplar.yearlyData[i];
          
          cropIncome = income.crops.yearly[i];
          poplarIncome = income.poplar.yearly[i];
          
          stats.poplarRevenue += poplarIncome - poplarCost.crop - poplarCost.water - poplarCost.land - poplarCost.transportation;
          stats.cropsRevenue += cropIncome - cropCost.crop;

          data.push([
            d.getFullYear()+'',
            stats.poplarRevenue,
            '$'+(stats.poplarRevenue).toFixed(2),
            stats.cropsRevenue,
            '$'+(stats.cropsRevenue).toFixed(2)
          ]);
          d.setFullYear(d.getFullYear()+1);
        }

        dt.addRows(data);

        this.$.duration.innerHTML = d.getFullYear() - startYear;

        this.$.crops.render(this.parcel);
        this.$.poplar.render(this.parcel, this.growthProfile);
        this.$.transportation.render(this.parcel, this.growthProfile);

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
        this.$.revenueChartLabel.innerHTML = '@ $'+this.refinery.poplarPrice+'/Mg';

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

        this.drawPoplar();
      },
      
      drawPoplar : function() {
        var id = this.parcel.properties.ucd.modelProfileId;
        var ws = this.growthProfile.ws;
        
        var dt = new google.visualization.DataTable();
        dt.addColumn('string', 'Month');
        dt.addColumn('number', 'Poplar (Mg / Acre)');
        var data = [];
        for( var i = 0; i < ws.length; i++ ) {
          data.push([i+'', ws[i] / 2.47105 ]);
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
      },

      getData : function(id, callback) {
        this.ebChain([
                {event: 'get-parcel', payload: {id}},
                {event: 'get-growth', stream: {id : (results) => results[0].properties.ucd.modelProfileId}},
                {event: 'get-selected-refinery'}
            ],
            (result) => {
              callback.apply(this, result);
            }
        );
      },

      _getRefineryGatePrice : function(callback) {
        this.getEventBus().emit('get-parcels-refinery-gate-price', {handler: callback});
      },

      getRgbaFromPrice : function(price) {
        var diff = price - this.prices.min;
        if( diff === 0 ) diff = 0.001;
        price = diff / (this.prices.max - this.prices.min);

        var v = Math.floor(200 * (1-price));
        var v2 = Math.floor(200 * price);
        return 'rgba(0,'+v2+','+v+',.8)';
      },

      getOverRgba : function() {
        return 'rgba(255,165,0,.6)';
      }
    });