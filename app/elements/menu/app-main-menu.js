    Polymer({
      is: 'app-main-menu',

      properties : {
        page : {
          type : String,
          observer : 'onPageUpdate'
        }
      },

      behaviors : [EventBusBehavior],

      ebBind : {
        'refinery-model-run-complete': 'onEnd'
      },

      setPage : function(e) {
        window.location.hash = e.currentTarget.getAttribute('page');
      },

      onPageUpdate : function() {
        if( this.page !== 'map' && this.page !== 'results' ) return;

        var $this = $(this);

        $this.find('.header').removeClass('selected');
        this.$[this.page+'-header'].classList.add('selected');

        $this.find('.content').hide();
        if( this.$[this.page+'-content'] ) {
          $this.find('#'+this.page+'-content').show();
        }
      },

      onEnd : function() {
        this.$['results-header'].style.display = 'block';
      },

      setMode : function(mode) {
        this.$.options.setMode(mode);
      },

      wireEvents : function(mapElement) {
        this.$.options.setMap(mapElement);
        this.$.filters.addEventListener('update-filters', (e) => {
          mapElement.filter(e.detail);
        });
        this.$.filters.addEventListener('toggle-all-parcels', (e) => {
          mapElement.toggleSelectedParcels(e.detail);
        });

        mapElement.addEventListener('render-filters', (e) => {
          this.$.filters.renderFilters(e.detail);
        });
      }

    });