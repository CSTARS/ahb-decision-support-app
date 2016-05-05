    Polymer({
      is: 'app-main-menu',

      ready : function() {
        this.page = "map";
        $(window).on('resize', this.resize.bind(this));
        this.resize();
      },

      resize : function() {
        this.style.height = ($(window).height()-64)+'px';
      },

      setPage : function(e) {
        var page = e.currentTarget.getAttribute('page');
        if( page === this.page ) return;
        this.page = page;

        var $this = $(this);

        $this.find('.header').removeClass('selected');
        this.$[page+'-header'].classList.add('selected');

        $this.find('.content').hide('slow');

        if( this.$[page+'-content'] ) {
          $this.find('#'+page+'-content').show('slow');

          if( this.$[page+'-content'].children[0].onShow ) {
            this.$[page+'-content'].children[0].onShow();
          }
        }


        this.fire('set-page', page);
      }
    });