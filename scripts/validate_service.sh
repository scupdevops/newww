#!/bin/bash
ps aux | grep server.js | grep -v grep
        if [ $? -eq 0 ]
            then
                echo "O newww esta rodando"
                exit 0
            else
                echo "O newww nao esta rodando"
                exit 1
        fi

