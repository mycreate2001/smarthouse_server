# 1. Communicate
## websocket
- use ws (mpm ws)
- protocol is same mqtt (aedes)
## mqtt (aedes)
- use aedes
- keep origin
## Network
- combine websocket & mqtt
- protocol look same mqtt (aedes)

# 2. Need to do
[local-database]

# 3. Module-level (Ver2)
- easy to add/remove middleware
- total level 1 ~ 10 (level10 is top), level1=lowest level, it's apply for communicate, database,...
- module will load from level 0-->10
- use type "network/websocket

