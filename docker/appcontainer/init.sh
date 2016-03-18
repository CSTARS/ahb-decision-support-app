#! /bin/bash

#apt-get update -y && apt-get -y install git python make g++
apt-get update -y && apt-get -y install git unzip default-jre


git clone https://github.com/CSTARS/ahb-decision-support-sdk ahb-decision-support-sdk
git clone https://github.com/CSTARS/ahb-decision-support-app ahb-decision-support-app

npm install -g bower

cd /ahb-decision-support-app && bower install --allow-root
cd /ahb-decision-support-app && npm install --production


cd / && unzip transportation-service.zip -d transportation-service
rm transportation-service.zip
