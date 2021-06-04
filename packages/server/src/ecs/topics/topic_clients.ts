import { createTopic } from "@javelin/ecs"
import { Client } from "../../client"

export const addedClients = createTopic<Client>()
export const removedClients = createTopic<Client>()
