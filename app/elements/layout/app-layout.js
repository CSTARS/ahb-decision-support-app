var sdk = require('../sdk');

Polymer({
    is: 'app-layout',

    ready : function() {
        $(window).on('resize', this.resize.bind(this));
    },

    attached : function() {
        this.resize();
    },

    resize : function() {
        var h = $(this.$.header).height();
        this.$.content.style.height = ($(window).height() - h) + 'px';
    },

    setPage : function(e) {
        var page = e.detail;
        $(this).find('.page').hide();
        this.$[page].style.display = 'block';

        if( this.$[page].onShow ) {
            this.$[page].onShow();
        }
    },

    toggleMenu : function() {
        $(this.$.menu).toggleClass('open');
    }
});
