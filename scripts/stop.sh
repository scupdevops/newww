#!/bin/bash
pgrep node
if [ $? -eq 0 ]
	then
	runuser -l deployer -c 'forever stop /var/www/newww/server.js'
	else
	exit 0
fi
