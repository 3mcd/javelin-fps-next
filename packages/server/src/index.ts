import { createHrtimeLoop } from "@javelin/hrtime-loop"
import { addedClients, removedClients, world } from "./ecs"
import { server, onClientConnected, onClientDisconnected } from "./net"

onClientConnected(client => {
  addedClients.push(client)
  client.channel.addEventListener("message", ({ data }) => {
    if (typeof data === "string") {
      const message = JSON.parse(data)
      // TODO(3mcd): we shouldn't assume message is input buffer
      for (let i = 0; i < message.length; i++) {
        client.inputs.push(message[i])
      }
    }
  })
})
onClientDisconnected(removedClients.push)

createHrtimeLoop(world.step, (1 / 60) * 1000).start()
server.listen(8000)
