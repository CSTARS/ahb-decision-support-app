var sdk = require('../../sdk');

function renderer(ctx, xyPoints, map, canvasFeature) {
    if( canvasFeature.type === 'Polygon' ||  canvasFeature.type === 'MultiPolygon' ) {
        polyRenderer(ctx, xyPoints, map, canvasFeature);
    } else {
        lineRenderer(ctx, xyPoints, map, canvasFeature);
    }
}

function polyRenderer(ctx, xyPoints, map, canvasFeature) {
    if( canvasFeature.type === 'MultiPolygon' ) {
        xyPoints.forEach(function(points){
            drawPolygon(ctx, points, canvasFeature);
        }.bind(this));
    } else {
        drawPolygon(ctx, xyPoints, canvasFeature);
    }
}

function drawPolygon(ctx, xyPoints, feature) {
    var point;
    if( xyPoints.length <= 1 ) {
        console.log('1 point path!');
        return;
    }

    ctx.beginPath();

    point = xyPoints[0];
    ctx.moveTo(point.x, point.y);
    for( var i = 1; i < xyPoints.length; i++ ) {
        ctx.lineTo(xyPoints[i].x, xyPoints[i].y);
    }
    ctx.lineTo(xyPoints[0].x, xyPoints[0].y);

    var a = feature.render.adoptionPricePercentile;
    //if( a < 0.2 ) a = 0.2;
    //if( a > 0.8 ) a = 0.8;
    
    //if( !feature.properties.ucd.render.selected ) {
    //    ctx.fillStyle = 'rgba(255,255,255,'+a+')';
    //} else {
        //ctx.fillStyle = 'rgba(0,188,212,.8)';
        var v = Math.floor(255 * a);
        ctx.fillStyle = 'rgba(0,188,'+v+',.8)';
        //ctx.fillStyle = 'rgba(0,'+Math.floor(140 + (v / 2))+','+v+',.8)';
    //}

    ctx.fill();
    
    /*ctx.lineWidth = 1;
    if( feature.properties.ucd.transportation.error || feature.properties.ucd.poplarGrowthError ) {
        ctx.strokeStyle = 'rgba(255,0,0,.8)';
        ctx.stroke();
    } else if( !feature.properties.ucd.render.selected ) {
        //ctx.strokeStyle = 'rgba(255, 152, 0,.8)';
        ctx.strokeStyle = 'rgba(150, 150, 150, .8)';
        ctx.stroke();
    } else {
        //ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        //ctx.strokeStyle = '#00BCD4';
    }*/
}

function lineRenderer(ctx, xyPoints, map, feature) {
    var point, last;
    if( xyPoints.length <= 1 ) return;

    ctx.beginPath();

    point = xyPoints[0];
    ctx.moveTo(point.x, point.y);
    last = point;
    for( var i = 1; i < xyPoints.length; i++ ) {
        point = xyPoints[i];
        if( point.x === last.x && point.y === last.y ) {
            continue;
        }
        ctx.lineTo(point.x, point.y);
        last = point;
    }

    if( feature.render.lineType === 'start') {
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineCap = 'round';
    } else {
        //var use = sdk.datastore.networkUse[feature.properties.id];
        //var p = use / sdk.datastore.maxNetworkUse;

        ctx.strokeStyle = '#607D8B';
    }

    ctx.lineWidth = 3;
    ctx.stroke();
};

module.exports = renderer;