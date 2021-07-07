import { mutableEmpty } from "@javelin/core"
import { createImmutableRef, useInterval, useWorld } from "@javelin/ecs"
import { InputSample } from "javelin-fps-shared"
import { Client } from "../../net"
import { inputTopic } from "../topics"

const useBuffer = createImmutableRef(() => [] as InputSample[])
export function sysNet() {
  const { latestTickData } = useWorld<Client>()
  const buffer = useBuffer()
  for (const sample of inputTopic) {
    buffer.push(sample)
  }
  if (useInterval((1 / 30) * 1000)) {
    latestTickData.channel.send(JSON.stringify(buffer))
    mutableEmpty(buffer)
  }
}
