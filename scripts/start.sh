#!/bin/bash
NODE_ENV='dev gulp dev'
runuser -l deployer -c 'cd /var/www/newww; npm run dev &'

