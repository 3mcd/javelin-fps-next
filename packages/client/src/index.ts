import "javelin-fps-shared"
import { world, messageHandler } from "./ecs"
import { connect } from "./net"

type PV<P> = P extends Promise<infer T> ? T : never

async function main() {
  let retries = 10
  let client: PV<ReturnType<typeof connect>>
  while (retries--) {
    try {
      client = await connect()
      break
    } catch {
      console.warn(
        `Failed to connect to game server.${retries ? " Trying again!" : ""}`,
      )
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  if (!client) {
    return
  }
  const { channel, socket } = client
  let bytes = 0
  let prev = performance.now()
  function handleMessage({ data }: MessageEvent<string | ArrayBuffer>) {
    if (data instanceof ArrayBuffer) {
      messageHandler.push(data)
      bytes += data.byteLength
    }
    const time = performance.now()
    if (time - prev >= 1000) {
      console.log(`${bytes / 1000} kb/s`)
      bytes = 0
      prev = time
    }
  }
  channel.addEventListener("message", handleMessage)
  socket.addEventListener("message", handleMessage)
  setInterval(function step() {
    world.step(client)
  }, (1 / 60) * 1000)
  ;(window as any).world = world
}

main()
