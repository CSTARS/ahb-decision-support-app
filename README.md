# AHB Decision Support Application
[http://willow.bioenergy.casil.ucdavis.edu/](http://willow.bioenergy.casil.ucdavis.edu/)

## About

The [AHB](http://hardwoodbiofuels.org/) AHB Decision Support App compares the
current cost, price and yield of a parcels crop to that of the poplar.

## services

### Parcels

To model the refinery, first you must know all surrounding parcels within a given
distance as well as how much of the given parcel is available for farming.  The
University of Washington has create a
[ArcGIS service](https://conifer.gis.washington.edu/arcgis/rest/services/AHBNW/AHBNW_20151009_parcel_featureAccess/MapServer)
providing a lookup for this information.

### Crop Type

Once you have the available parcels, you need to find the current crop(s) being
grown at each parcel.  For this we use the geometry of the parcel and query against
the NASS CDL data to return crop types for each parcel.

### Crop price, yield

Once you have the current crop types, we lookup price and yield for each crop at
the parcels specified location (via fips code) against a NASS yield data set.

### Crop Budget (cost)

Crop budgets are managed at [farmbudgets.org](http://farmbudgets.org).  Each crop
type is looked up based on location.  The farm budgets app has an available
[SDK](https://www.npmjs.com/package/farm-budgets-sdk) that can be used to lookup
can calculate crop cost from inside the Decision Support App.

### Weather / Soil Data

To simulate the growth of poplar trees on each parcel a JavaScript port of the
3PG model is used (more below).  This model requires soil and weather data at each
location.  Once parcel locations are retrieved, soil and weather data for each
parcel are fetched from the server.  The soil data is based on
[Statsgo](http://www.nrcs.usda.gov/wps/portal/nrcs/surveylist/soils/survey/state/?stateId=CA)
and the weather is a 10 year average of the [PRISM](http://www.prism.oregonstate.edu/) dataset.  

### Poplar growth (yield)

Once the application as soil and weather, the poplar tree growth and harvest is simulated
for each parcel over 14 years on a 2 year coppice cycle.  The poplar is modeled
using the 3PG Growth Model which has a JavaScript port [available here](https://www.npmjs.com/package/poplar-3pg-model)
allowing the trees to be modeled inside the browser.

### Transportation

Transportation routes and costs are calculated using [Open Street Map](http://www.openstreetmap.org/)
data and a shortest path routing server [osm2po](http://osm2po.de/).  This server
stores the graph in memory allowing for extremely fast lookups allowing us to calculate
routes from every parcel to the biorefinery in realtime.

## App Tech Stack

Backend
 - PostgreSQL/PostGIS: Stores the weather, soil, crop type, crop price, crop yield data
 - [ExpressJS](http://expressjs.com/)/NodeJS: Application server

Client
 - [Polymer](https://www.polymer-project.org/)
 - [Bootstrap](http://getbootstrap.com/)
 - [Leaflet](http://leafletjs.com/)
 - [farm-budgets-sdk](https://www.npmjs.com/package/farm-budgets-sdk)
 - [poplar-3pg-model](https://www.npmjs.com/package/poplar-3pg-model)

The code business logic for the Decision Support App is wrapped into an SDK as well.
So the entire application is scriptable. [CSTARS/ahb-decision-support-sdk](https://github.com/CSTARS/ahb-decision-support-sdk)
