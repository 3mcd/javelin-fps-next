import { mutableEmpty } from "@javelin/core"
import { createImmutableRef, useRef, useWorld } from "@javelin/ecs"
import { InputSample } from "javelin-fps-shared"
import { inputTopic } from "../topics"
import { WorldTickData } from "../types"

const useBuffer = createImmutableRef(() => [] as InputSample[])
export function sysNet() {
  const {
    latestTickData: { client },
  } = useWorld<WorldTickData>()
  const buffer = useBuffer()
  for (const sample of inputTopic) {
    buffer.push(sample)
  }
  const send = useRef(true)
  // send inputs at 1/2 tick rate
  if (send.value) {
    client.channel.send(JSON.stringify(buffer))
    mutableEmpty(buffer)
  }
  send.value = !send.value
}
