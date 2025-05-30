#!/bin/bash
set -e

read -p "what is the name of your server: " SERVER
sed -e "s%yourdomain.org%$SERVER%g" config.env.template > config.env

./setup.sh

sed -e "s%/usr/local/https-integrator/%$PWD/%g" https-integrator.service.template > https-integrator.service

SERVICE_NAME=https-integrator.service

sudo cp -p $SERVICE_NAME /etc/systemd/system/
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo "$SERVICE_NAME installed and started."
