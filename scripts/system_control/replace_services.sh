#!/bin/bash
sudo cp /home/fullsend/cryptovesting/app/front/manaul.service /lib/systemd/system/manaul_entry.service
sudo cp /home/fullsend/cryptovesting/app/discord_bot/discord_bot.service /lib/systemd/system/discord_bot.service
sudo cp /home/fullsend/cryptovesting/app/worker_manager/cryptovestingapp.service /lib/systemd/system/cryptovestingapp.service
sudo systemctl daemon-reload