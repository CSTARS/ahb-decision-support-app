function isValid(parcel) {
  
  if( parcel.geometry ) {
    if( parcel.geometry.type === 'Polygon' ) {
      verifyRing(parcel.geometry.coordinates);
      return true;
    } else if( parcel.geometry.type === 'MultiPolygon' ) {
      parcel.geometry.coordinates.forEach(poly => verifyRing(poly));
      return true;
    } else if( parcel.geometry.type === 'GeometryCollection' ) {
      var newGeom = {
        type : 'MultiPolygon',
        coordinates : []
      };

      parcel.geometry.geometries.forEach((g) => {
        if( g.type === 'Polygon' ) {
          newGeom.coordinates.push(verifyRing(g.coordinates));
        } else if( g.type === 'MultiPolygon' ) {
          g.coordinates.forEach(poly => newGeom.coordinates.push(verifyRing(poly)));
        }
      });

      // no polygons found;
      if( newGeom.coordinates.length === 0 ) {
        return false;
      }

      parcel.geometry = newGeom; 

    } else {
      return false;
    }
  } else {
    return false;
  }

  return true;
}

function verifyRing(coordinates) {
  var len = coordinates.length-1;
  if( coordinates[0][0] !== coordinates[len][0] || coordinates[0][1] !== coordinates[len][1] ) {
    coordinates.push(coordinates[0]);
  }
  return coordinates;
}

module.exports = isValid;