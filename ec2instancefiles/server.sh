#!/bin/bash

# set the path of the file
CONFIG_FILE=~/server_config.txt

if [[ ! -f $CONFIG_FILE ]]; then
    echo "Configuration file not found!"
    exit 1
fi

# get the server type eg minecraft_1.21
SERVER_TYPE=$(grep '^server=' $CONFIG_FILE | cut -d'=' -f2)

# check if there is a server type
if [[ -z $SERVER_TYPE ]]; then
    echo "Server type not specified in configuration file!"
    exit 1
fi

SCREEN="server"

# Functions to handle specific server types for starting
start_minecraft_1_21() {
    cd ~/Minecraft-Server
    pwd
    screen -dmS $SCREEN java -Xmx3G -Xms3G -jar server.jar nogui
}

start_modded_minecraft_1_20_1() {
    cd ~/Minecraft-Server
    screen -dmS $SCREEN ./run.sh
}

start_minecraft_BCGPlus() {
    cd ~/Minecraft-Server/Server-Files
    pwd
    screen -dmS $SCREEN java -Xmx6G -jar fabric-server-launch.jar nogui
}

start_ark() {
    # Add ARK start command here
    echo "nice Function"
}

# Functions to handle specific server types for stopping
stop_minecraft() {
    screen -S $SCREEN -X stuff "stop$(printf '\r')"
}

stop_ark() {
    echo "Stopping ARK server..."
    #screen -S $SCREEN -X stuff "stop$(printf '\r')"
}

start_server() {
    case "$SERVER_TYPE" in
        minecraft-1.21)
            start_minecraft_1_21
            ;;
        modded-minecraft-1.20.1)
            start_modded_minecraft_1_20_1
            ;;
        ark)
            start_ark
            ;;
        minecraft-BCGPlus-1.20.1)
            start_minecraft_BCGPlus
            ;;
        *)
            echo "Unknown server type: $SERVER_TYPE"
            exit 1
            ;;
    esac
}

stop_server() {
    case "$SERVER_TYPE" in
        minecraft-1.21 | modded-minecraft-1.20.1 | minecraft-BCGPlus-1.20.1)
            stop_minecraft
            ;;
        ark)
            stop_ark
            ;;
        *)
            echo "Unknown server type: $SERVER_TYPE"
            exit 1
            ;;
    esac
}

update_server() {
    # Add update logic here
    echo "update not available"
}

case "$1" in
    -s)
        start_server
        ;;
    -e)
        stop_server
        ;;
    -u)
        update_server
        ;;
    *)
        echo "Usage: server {-s|-e|-u}"
        exit 1
        ;;
esac
