#!/bin/bash
sudo cp /home/fullsend/scripts/rugmenot_contracts/service/tokens_listener.service /lib/systemd/system/tokens_listener.service
sudo cp /home/fullsend/app/back/manual_backend.service /lib/systemd/system/manual_backend.service
sudo cp /home/fullsend/app/front/manaul_entry.service /lib/systemd/system/manaul_entry.service