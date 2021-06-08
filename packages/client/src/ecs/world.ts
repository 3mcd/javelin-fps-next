import { createWorld } from "@javelin/ecs"
import { createMessageHandler } from "@javelin/net"
import { Client } from "../net"
import * as Systems from "./systems"
import * as Topics from "./topics"

export const world = createWorld<Client>({
  systems: Object.values(Systems),
  topics: Object.values(Topics),
})

export const messageHandler = createMessageHandler(world)
world.addSystem(messageHandler.system)
