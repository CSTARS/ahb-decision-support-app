#! /usr/bin/make -f

curl http://spatialreference.org/ref/sr-org/8363/postgis/ | psql -d quinn
#98363

pwd:=$(shell pwd)
size:=4096
cdl.srid:=98363
cdl.fn:=2015_30m_cdls.img

cdl.m${size}.sql:
	raster2pgsql -c -s ${cdl.srid} -R ${pwd}/2015_30m_cdls.img -t ${size}x${size} cdl.m${size} > $@

cdl.pixels:
	${PG} -f transform.sql

test.json:
	curl 'https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer/0/query?f=json&where=AFRILandUseCategory%20%3D%20%27Agriculture%27&returnGeometry=true&geometryPrecision=4&maxAllowableOffset=0.0001&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-122.9706573486328%2C%22ymin%22%3A46.63712582089975%2C%22xmax%22%3A-122.94448222474479%2C%22ymax%22%3A46.65509212658214%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryEnvelope&inSR=4326&outFields=PolyID%2C%20SiteAddressFull%2C%20Township%2C%20GISAcres%2C%20PotentiallySuitPctOfParcel&outSR=4326' > test.json

test.geojson: test.json
	jq '{type: "GeometryCollection", geometries :[{type : "Polygon",coordinates: .features[].geometry.rings}]}' < $< |\
	  tr -d ' \n' > $@
