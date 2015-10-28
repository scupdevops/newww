#!/bin/bash
cd /var/www/newww
npm install marky-markdown
cd node_modules; mkdir @soldair; mv marky-markdown/ \@soldair/
cd /var/www/newww/
sed -i "/\"\@soldair\/marky-markdown\"\: \"\^6\.0\.0\"\,/d" package.json
npm install
npm install newrelic
cp /var/www/newww/node_modules/newrelic/newrelic.js /var/www/newww/
sed -i "/license_key: 'license key here',/c\license_key: '16a02e8939511e498f74973392dbad93f024a7da'," newrelic.js
sed -i "/app_name: \['My Application'\],/c\app_name: \['newww'\]," newrelic.js
chown -R deployer:deployer /var/www/newww
