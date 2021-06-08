import { Sun } from "javelin-fps-shared"
import {
  useRef,
  useWorld,
  component,
  useInterval,
  observe,
  createQuery,
} from "@javelin/ecs"

// const S_PER_DAY = 60 * 60 * 24
// const DEG_PER_S = 360 / S_PER_DAY

const qrySun = createQuery(Sun)

// const cycleSpeed = 10000

export function sysDayNightCycle() {
  const { create } = useWorld()
  const init = useRef(true)
  if (init.value) {
    create(component(Sun, { inclination: 0.399, azimuth: 0.25 }))
    init.value = false
  }
  if (useInterval(100)) {
    qrySun((_, [s]) => {
      observe(s).inclination += 0.01
    })
  }
}
