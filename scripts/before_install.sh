#!/bin/bash
useradd deployer
chown -R deployer:deployer /var/www/newww/
sed -i "/HOSTNAME=localhost.localdomain/c\HOSTNAME=app-$(echo $RANDOM)" /etc/sysconfig/network
hostname  $(cat /etc/sysconfig/network | grep HOSTNAME | awk -F'=' '{print $2}')
echo $(ip a s | grep eth0 | grep inet | awk -F' ' '{print $2}' | awk -F'/' '{print $1}') $(hostname).scup.com $(hostname) >> /etc/hosts
echo "172.30.4.165 puppetmaster.scup.com puppetmaster" >> /etc/hosts
yum groupinstall -y 'Development Tools'
curl -sL https://rpm.nodesource.com/setup | bash -
yum install -y nodejs puppet
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
echo "* * * * * root puppet agent --test --server puppetmaster.scup.com" >> /etc/cron.d/puppet
