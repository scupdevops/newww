#!/bin/bash
pgrep node
if [ $? -eq 0 ]
	then
	kill -15 $(pgrep node)
	else
	exit 0
fi
