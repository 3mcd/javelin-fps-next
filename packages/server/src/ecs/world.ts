import { createWorld } from "@javelin/ecs"
import { Clock } from "@javelin/hrtime-loop"
import * as Systems from "./systems"
import * as Topics from "./topics"

export const world = createWorld<Clock>({
  systems: Object.values(Systems),
  topics: Object.values(Topics),
})
