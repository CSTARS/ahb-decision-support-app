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

    if( feature.render.aboveRefineryWillingToPay ) {
        ctx.fillStyle = 'rgba(255,165,0,.6)';
    } else {
        var a = feature.render.adoptionPricePercentile;
        var v = Math.floor(200 * (1-a));
        var v2 = Math.floor(200 * a);
        ctx.fillStyle = 'rgba(0,'+v2+','+v+',.8)';
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

    if( feature.render.lineType === 'start') {
        ctx.strokeStyle = '#CFD8DC';
        ctx.lineCap = 'round';
    } else {
        ctx.strokeStyle = '#607D8B';
    }

    ctx.lineWidth = 3;
    ctx.stroke();
};

module.exports = renderer;