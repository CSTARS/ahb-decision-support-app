
Polymer({
    is: 'parcel-info-popup',
    ready : function() {
        this.popup = $(this.$.popup).remove();
        $('body').append(this.popup);
        this.popup.modal({
            show: false
        });
    },

    show : function(parcel, growthProfile) {
        this.popup.modal('show');
        setTimeout(function(){
            this.$.parcelInfo.growthProfile = growthProfile;
            this.$.parcelInfo.parcel = parcel;
        }.bind(this), 500);
    },

    hide : function() {
        this.popup.modal('hide');
    }

})
