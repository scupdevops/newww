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
cp /var/www/newww/env /var/www/newww/.env
cp /var/www/newww/env.example /var/www/newww/.env.example
cd /tmp
wget http://download.redis.io/releases/redis-3.0.5.tar.gz
tar xzf redis-3.0.5.tar.gz
cd redis-3.0.5
make -j 9
./src/redis-server &
npm install forever -g
npm install -g gulp
npm install gulp-util
npm install pretty-hrtime
npm install chalk
npm install semver
npm install archy
npm install liftoff
npm install tildify
npm install interpret
npm install v8flags
npm install gulp
chown -R deployer:deployer /var/www/newww
