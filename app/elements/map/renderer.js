var sdk = require('../sdk');

function renderer(ctx, xyPoints, map, feature) {
    if( feature.geometry.type === 'Polygon' ||  feature.geometry.type === 'Polygon' ) {
        polyRenderer(ctx, xyPoints, map, feature);
    } else {
        lineRenderer(ctx, xyPoints, map, feature);
    }
}

function polyRenderer(ctx, xyPoints, map, feature) {
    var render = feature.properties.ucd.render;

    if( feature.geometry.type === 'MultiPolygon' ) {
        xyPoints.forEach(function(points){
            drawPolygon(ctx, points, feature);
        }.bind(this));
    } else {
        drawPolygon(ctx, xyPoints, feature);
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

    if( feature.properties.ucd.transportation.properties.error || feature.properties.ucd.poplarGrowthError ) {
        ctx.strokeStyle = 'rgba(255,0,0,.8)';
    } else if( !feature.properties.ucd.render.selected ) {
        ctx.strokeStyle = 'rgba(255, 152, 0,.8)';
    } else {
        ctx.strokeStyle = '#00BCD4';
    }

    ctx.lineWidth = 3;
    ctx.stroke();

    if( !feature.properties.ucd.render.selected ) {
        ctx.fillStyle = 'rgba(255,255,255,.8)';
    } else {
        ctx.fillStyle = 'rgba(0,188,212,.3)';
    }

    ctx.fill();
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

    if( feature.properties.type === 'start') {
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineCap = 'round';
    } else {
        var use = sdk.datastore.networkUse[feature.properties.id];
        var p = use / sdk.datastore.maxNetworkUse;

        ctx.strokeStyle = '#607D8B';
    }

    ctx.lineWidth = 3;
    ctx.stroke();
};

module.exports = renderer;