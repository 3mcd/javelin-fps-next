import {
  component,
  ComponentOf,
  useInterval,
  useRef,
  useWorld,
} from "@javelin/ecs"
import { Player, Position, Rotation, Velocity, Wall } from "javelin-fps-shared"
import { useMap } from "../effects"
import { addedClients } from "../topics"

export function sysSpawnPlayerActors() {
  const { create } = useWorld()
  for (const client of addedClients) {
    create(
      component(Player, { clientId: client.id }),
      component(Position, { x: 50, y: 50, z: 50 }),
      component(Rotation, { w: 1 }),
      component(Velocity, { y: -9.81 }),
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
          const { x, y, z } = desc[1] as ComponentOf<typeof Position>
          create(
            component(Position, { x, y, z }),
            component(Rotation, { w: 1 }),
            component(Wall),
          )
          break
      }
    }
    state.value = 2
  }
}

export function sysSpawnFun() {
  const { create } = useWorld()
  const count = useRef(0)
  if (useInterval(50) && count.value < 500) {
    create(
      component(Position, {
        x: (0.5 - Math.random()) * 20,
        y: Math.random() * 100,
        z: (0.5 - Math.random()) * 20,
      }),
      component(Rotation, { w: 1 }),
      component(Velocity),
    )
    count.value++
  }
}
