import { component, ComponentOf, useRef, useWorld } from "@javelin/ecs"
import {
  Player,
  Quaternion,
  Transform,
  Velocity,
  Wall,
} from "javelin-fps-shared"
import { useMap } from "../effects/use_map"
import { addedClients } from "../topics"

export function sysSpawnPlayerActors() {
  const { create } = useWorld()
  for (const client of addedClients) {
    create(
      component(Player, { clientId: client.id }),
      component(Transform),
      component(Quaternion, { w: 1 }),
      component(Velocity),
    )
  }
}

export function sysSpawnMapEntities() {
  const { create } = useWorld()
  const map = useMap("arena")
  const state = useRef(0)
  if (state.value === 0 && map !== null) state.value = 1
  if (state.value === 1) {
    for (let i = 0; i < map.length; i++) {
      const desc = map[i]
      switch (desc[0]) {
        case "wall":
          const { x, y, z } = desc[1] as ComponentOf<typeof Transform>
          create(
            component(Transform, { x, y, z }),
            component(Quaternion, { w: 1 }),
            component(Wall, { test: 123 }),
          )
          break
      }
    }
    state.value = 2
  }
}
