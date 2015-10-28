#!/bin/bash
NODE_ENV='dev gulp dev'
runuser -l deployer -c 'cd /var/www/newww; nohup npm run dev > /dev/null &'
