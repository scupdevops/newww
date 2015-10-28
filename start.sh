#!/bin/bash
runuser -l deployer -c 'cd /var/www/newww; nohup npm run dev > /dev/null &'
