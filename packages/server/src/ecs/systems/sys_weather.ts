import {
  component,
  createQuery,
  observe,
  useInterval,
  useRef,
  useWorld,
} from "@javelin/ecs"
import { Sun } from "javelin-fps-shared"

const qrySun = createQuery(Sun)

export function sysDayNightCycle() {
  const { create } = useWorld()
  const init = useRef(true)
  if (init.value) {
    create(component(Sun, { inclination: 0.399, azimuth: 0.25 }))
    init.value = false
  }
  if (useInterval(1000)) {
    qrySun((_, [s]) => {
      observe(s).inclination += 0.001
    })
  }
}
