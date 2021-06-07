import {
  createQuery,
  createRef,
  Query,
  useInterval,
  useMonitor,
  useWorld,
} from "@javelin/ecs"
import { createMessageProducer, encode, model } from "@javelin/net"
import {
  Player,
  Quaternion,
  Transform,
  Velocity,
  Wall,
} from "javelin-fps-shared"
import { Client } from "../../client"
import { useClients } from "../effects/use_clients"
import { addedClients, removedClients } from "../topics"

const useEvents = createRef(() => createMessageProducer())

const qryPlayers = createQuery(Player)
const qryBodies = createQuery(Transform, Quaternion)
const qryWalls = createQuery(Wall)
const qryDynamic = createQuery(Transform, Quaternion, Velocity)

const SYNC_BASIC: Query[] = [qryBodies, qryPlayers, qryWalls]

export function sysNet() {
  const { destroy } = useWorld()
  const { value: events } = useEvents()
  const clients = useClients()
  // create actors for newly connected clients
  for (const client of addedClients) {
    SYNC_BASIC.forEach(q => q(client.producer.attach))
  }
  for (const client of removedClients) {
    qryPlayers((e, [p]) => {
      if (p.clientId === client.id) {
        destroy(e)
      }
    })
  }
  // sync bodies, players and walls
  SYNC_BASIC.forEach(q => useMonitor(q, events.attach, events.detach))
  // sync dynamic positions and rotations
  qryPlayers((_, [p]) => {
    const client = clients.get(p.clientId)
    if (client) qryDynamic(client.producer.update)
  })
  // send updates
  if (useInterval((1 / 30) * 1000)) {
    const reliable = events.take()
    const reliableEncoded = encode(reliable)
    for (const [, client] of clients) {
      const unreliable = client.producer.take()
      if (!client.modelSent) {
        model(reliable)
        client.socket.send(encode(reliable))
        client.socket.send(encode(unreliable))
        client.modelSent = true
      } else {
        client.socket.send(reliableEncoded)
        if (client.channel.readyState === "open") {
          client.channel.send(encode(unreliable))
        }
      }
    }
  }
}
