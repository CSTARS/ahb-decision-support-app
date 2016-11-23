
module.exports = function(x, y) {
  return `select 
  pid, 
  x,
  y,
  north,
  east,
  SUM(totalacres * overlap * usable)
from 
(select 
  px.pid, 
  px.x,
  px.y,
  px.north,
  px.east,
  (parcel.properties::json->>'GISAcres')::float as totalAcres,
  (st_area(
    ST_Intersection(
      px.boundary, 
      ST_buffer(
        ST_transform(
          parcel.geometry,
          97260
        ), 0
      )
    )
  ) 
  /
  st_area(
    ST_buffer(
      ST_transform(
        parcel.geometry,
        97260
      ),0
    )
  ))
  as overlap,
  (parcel.properties::json->>'PotentiallySuitPctOfParcel')::float as usable 
from 
  afri.pixels px, 
  parcel_cache as parcel 
where 
  px.x = ${x} and 
  px.y = ${y} and 
  st_intersects(
    ST_Transform(px.boundary, 4326),
    parcel.geometry
  )
) as pixel
GROUP BY pid, x, y, north, east`;
}