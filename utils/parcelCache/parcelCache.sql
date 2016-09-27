DROP TABLE IF EXISTS parcel_cache;
CREATE table parcel_cache(
  properties  VARCHAR
);

SELECT AddGeometryColumn ('parcel_cache','geometry', 0,'GEOMETRY',2);
