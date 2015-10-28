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
echo "* * * * * root puppet agent --test --server puppetmaster.scup.com" >> /etc/cron.d/puppet
cd /tmp
wget http://download.redis.io/releases/redis-3.0.5.tar.gz
tar xzf redis-3.0.5.tar.gz
cd redis-3.0.5
make
./src/redis-server &
