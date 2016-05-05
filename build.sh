#! /bin/bash

cpFiles=( "index.html" "js/webcomponents.js" "font-awesome/fonts" "images" )
dist=dist

rm -rf $dist
poly-next -r app -m elements -n index -d app/elements

mkdir -p $dist
mkdir -p $dist/js
mkdir -p $dist/font-awesome

for file in "${cpFiles[@]}"; do
    cp -r app/$file $dist/$file
done

vulcanize --inline-scripts --strip-comments --inline-css app/elements.html > $dist/elements.html

# HACK... 
sed -i '' 's/bower_components\/leaflet\/dist\/images\/layers.png/\/images\/leaflet\/layers.png/g' $dist/elements.html

rm app/elements/index.html