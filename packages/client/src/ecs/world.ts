import { createWorld } from "@javelin/ecs"
import { createMessageHandler } from "@javelin/net"
import { sysPhysics } from "javelin-fps-shared"
import * as Systems from "./systems"
import * as Topics from "./topics"
import { WorldTickData } from "./types"

export const world = createWorld<WorldTickData>({
  systems: [...Object.values(Systems), sysPhysics],
  topics: Object.values(Topics),
})

export const messageHandler = createMessageHandler(world)
world.addSystem(messageHandler.system)
