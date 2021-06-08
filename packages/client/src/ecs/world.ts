import { createWorld } from "@javelin/ecs"
import { createMessageHandler } from "@javelin/net"
import * as Systems from "./systems"

export const world = createWorld<string>({
  systems: Object.values(Systems),
})

export const messageHandler = createMessageHandler(world)
world.addSystem(messageHandler.system)
