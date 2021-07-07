import * as Rapier from "@a-type/rapier3d-node"
import { Clock, createHrtimeLoop } from "@javelin/hrtime-loop"
import { addedClients, removedClients, world } from "./ecs"
import { WorldTickData } from "./ecs/types"
import { server, onClientConnected, onClientDisconnected } from "./net"

onClientConnected(client => {
  addedClients.push(client)
  client.channel.addEventListener("message", ({ data }) => {
    if (typeof data === "string") {
      const message = JSON.parse(data)
      // TODO(3mcd): we shouldn't assume message is input buffer
      for (let i = 0; i < message.length; i++) {
        client.input.buffer.push(message[i])
      }
    }
  })
})
onClientDisconnected(removedClients.push)

const worldTickData: WorldTickData = {
  clock: { now: BigInt(0), tick: 0, dt: 0 },
  Rapier: Rapier,
}

function step(clock: Clock) {
  worldTickData.clock = clock
  world.step(worldTickData)
}

createHrtimeLoop(step, (1 / 60) * 1000).start()
server.listen(8000)
