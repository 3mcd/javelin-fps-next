import { mutableEmpty } from "@javelin/core"
import { useInterval, useWorld } from "@javelin/ecs"
import { createImmutableRef, InputSample } from "javelin-fps-shared"
import { Client } from "../../net"
import { inputTopic } from "../topics"

const useBuffer = createImmutableRef(() => [] as InputSample[])
export function sysNet() {
  const { latestStepData } = useWorld()
  const buffer = useBuffer()
  for (const sample of inputTopic) {
    buffer.push(sample)
  }
  if (useInterval((1 / 30) * 1000)) {
    ;(latestStepData as Client).channel.send(JSON.stringify(buffer))
    mutableEmpty(buffer)
  }
}
