import { createWorld } from "@javelin/ecs"
import * as Systems from "./systems"

export const world = createWorld({
  systems: Object.values(Systems),
})
