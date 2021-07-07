import { Clock } from "@javelin/hrtime-loop"
import { WorldTickData as WorldTickDataShared } from "javelin-fps-shared"

export type WorldTickData = WorldTickDataShared & {
  clock: Clock
}
