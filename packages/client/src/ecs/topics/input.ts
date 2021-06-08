import { createTopic } from "@javelin/ecs"
import { InputSample } from "javelin-fps-shared"

export const inputTopic = createTopic<InputSample>()
