# /bin/bash

TOOLDIR=osm2po
DEST=ahb
DATAROOT="http://download.geofabrik.de/north-america/us/"
FILES=("california" "oregon" "washington" "idaho")

# grab tool
if [ ! -d "$TOOLDIR" ]; then
  wget http://osm2po.de/releases/osm2po-5.1.0.zip
  unzip osm2po-5.1.0.zip -d osm2po
  rm osm2po-5.1.0.zip
fi

# prepare each state
ALL=""
for i in "${FILES[@]}"
do
  java -Xmx1408m -jar osm2po/osm2po-core-5.1.0-signed.jar cmd=c workDir=data/$i prefix=$i tileSize=x,c $DATAROOT$i-latest.osm.pbf
  ALL=$ALL" data/"$i
done

# merge each state into $DEST.  fires up test server when completed
java -Xmx1g -jar osm2po/osm2po-core-5.1.0-signed.jar workDir=data/$DEST cmd=m tileSize=x,c prefix=$DEST $ALL
java -Xmx1g -jar osm2po/osm2po-core-5.1.0-signed.jar workDir=data/$DEST cmd=sg tileSize=x,c prefix=$DEST
java -Xmx1g -jar osm2po/osm2po-core-5.1.0-signed.jar workDir=data/$DEST cmd=r tileSize=x,c prefix=$DEST
