import {
  Component,
  createImmutableRef,
  createQuery,
  Query,
  useInterval,
  useMonitor,
  useRef,
  useWorld,
} from "@javelin/ecs"
import { createMessageProducer, encode } from "@javelin/net"
import {
  Player,
  Position,
  Rotation,
  Sun,
  Velocity,
  Wall,
} from "javelin-fps-shared"
import { useClients } from "../effects/use_clients"
import { addedClients, removedClients } from "../topics"

const useEvents = createImmutableRef(() => createMessageProducer())

const qrySun = createQuery(Sun)
const qryPlayers = createQuery(Player)
const qryBodies = createQuery(Position, Rotation)
const qryWalls = createQuery(Wall)
const qryDynamic = createQuery(Position, Rotation, Velocity)

const tmpComponentUpdate: Component[] = []

const SYNC_BASIC: Query[] = [qrySun, qryBodies, qryPlayers, qryWalls]

export function sysNet() {
  const { destroy, tryGet, has } = useWorld()
  const events = useEvents()
  const clients = useClients()
  // build initial view for newly connected clients
  for (const client of addedClients) {
    SYNC_BASIC.forEach(q => q(client.producer.attach))
  }
  // destroy entities controlled by disconnected clients
  for (const client of removedClients) {
    qryPlayers((e, [p]) => {
      if (p.clientId === client.id) destroy(e)
    })
  }
  // sync bodies, players and walls
  SYNC_BASIC.forEach(q => useMonitor(q, events.attach, events.detach))
  // sync dynamic positions and rotations
  qryPlayers((ep, [{ clientId }]) => {
    const client = clients.get(clientId)
    const pos = tryGet(ep, Position)
    if (client)
      qryDynamic((ed, [p, q]) => {
        const amplify =
          ed === ep || has(ed, Player)
            ? // always send player positions
              Infinity
            : pos
            ? // send closer entities more frequently
              1 / Math.hypot(pos.x - p.x, pos.y - p.y)
            : 1
        tmpComponentUpdate.length = 0
        tmpComponentUpdate[0] = p
        tmpComponentUpdate[1] = q
        client.producer.update(ed, tmpComponentUpdate, amplify)
      })
  })
  qrySun((e, [s]) => events.patch(e, s, Infinity))

  const send = useRef(true)
  // send updates at 1/2 tick rate
  if (send.value) {
    const reliable = encode(events.take())
    for (const [, client] of clients) {
      const message = client.producer.take()
      const unreliable = encode(message)
      if (!client.initialized) {
        client.socket.send(unreliable)
        client.socket.send(reliable)
        client.initialized = true
      } else {
        if (client.channel.readyState === "open") {
          client.channel.send(unreliable)
        }
        client.socket.send(reliable)
      }
    }
  }
  send.value = !send.value
}
