import {
  Component,
  createQuery,
  createRef,
  Query,
  useInterval,
  useMonitor,
  useWorld,
} from "@javelin/ecs"
import {
  createMessage,
  createMessageProducer,
  encode,
  model,
} from "@javelin/net"
import {
  Player,
  Rotation,
  Position,
  Velocity,
  Wall,
  createImmutableRef,
  Sun,
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
  const { destroy, tryGet } = useWorld()
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
          ed === ep
            ? // always send player position
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
  // send updates
  if (useInterval((1 / 30) * 1000)) {
    const reliable = events.take()
    const reliableEncoded = encode(reliable)
    for (const [, client] of clients) {
      const unreliable = client.producer.take()
      if (!client.modelSent) {
        const message = createMessage()
        model(message)
        client.socket.send(encode(message))
        client.socket.send(encode(reliable))
        client.modelSent = true
      } else {
        client.socket.send(reliableEncoded)
      }
      if (client.channel.readyState === "open") {
        client.channel.send(encode(unreliable))
      }
    }
  }
}
