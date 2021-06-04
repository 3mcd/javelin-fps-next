import { createHrtimeLoop } from "@javelin/hrtime-loop"
import { addedClients, removedClients, world } from "./ecs"
import { server, onClientConnected, onClientDisconnected } from "./net"

onClientConnected(addedClients.push)
onClientDisconnected(removedClients.push)

createHrtimeLoop(world.step, (1 / 60) * 1000).start()
server.listen(8000)
