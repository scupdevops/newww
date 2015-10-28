#!/bin/bash
cd /var/www/newww
rm -rf /var/www/newww/node_modules
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
rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
rpm -Uvh http://rpms.remirepo.net/enterprise/remi-release-6.rpm
yum --enablerepo=remi,remi-test install -y redis 
/etc/init.d/redis start
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
npm install imagemin-pngcrush
chown -R deployer:deployer /var/www/newww
