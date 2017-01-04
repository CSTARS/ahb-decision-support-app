var sdk = require('../sdk');

    Polymer({
      is: 'app-main-menu',

      ready : function() {
        this.page = "map";
        $(window).on('resize', this.resize.bind(this));
        $(window).on('hashchange', this.updatePage.bind(this));
        sdk.eventBus.on('refinery-model-run-complete', this.onEnd.bind(this));
        this.resize();
      },

      resize : function() {
        this.style.height = ($(window).height()-64)+'px';
      },

      setPage : function(e) {
        window.location.hash = e.currentTarget.getAttribute('page');
      },

      updatePage : function() {
        var page = window.location.hash.replace(/#/,'').split('/');
        if( page.length === 0 ) page = 'map';
        else page = page[0];
        
        if( page !== 'map' && page !== 'results' ) return;

        var $this = $(this);

        $this.find('.header').removeClass('selected');
        this.$[page+'-header'].classList.add('selected');

        $this.find('.content').hide();
        if( this.$[page+'-content'] ) {
          $this.find('#'+page+'-content').show();
        }

        if( page === 'map' ) this.$.mapIcon.icon = 'expand-less';
        else this.$.mapIcon.icon = 'expand-more';
      },

      onEnd : function() {
        this.$['results-header'].style.display = 'block';
      }

    });