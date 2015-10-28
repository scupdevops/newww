#!/bin/bash
sleep 60
ps aux | grep node | grep -v grep
        if [ $? -eq 0 ]
            then
                echo "O newww esta rodando"
                exit 0
            else
                echo "O newww nao esta rodando"
                exit 1
        fi

