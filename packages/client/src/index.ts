import { createMessageHandler } from "@javelin/net"
import "javelin-fps-shared"
import { world } from "./ecs"
import { connect } from "./net"

async function main() {
  const { channel, socket } = await connect()
  const messages = createMessageHandler(world)
  function handleMessage({ data }: MessageEvent<string | ArrayBuffer>) {
    if (data instanceof ArrayBuffer) {
      messages.push(data)
    }
  }
  channel.addEventListener("message", handleMessage)
  socket.addEventListener("message", handleMessage)
  world.addSystem(messages.system)
  const step = () => {
    world.step()
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  ;(window as any).world = world
}

main()
