import { createWorld } from "@javelin/ecs"
import { sysPhysics } from "javelin-fps-shared"
import * as Systems from "./systems"
import * as Topics from "./topics"
import { WorldTickData } from "./types"

export const world = createWorld<WorldTickData>({
  systems: [...Object.values(Systems), sysPhysics],
  topics: Object.values(Topics),
})
