import {
  component,
  ComponentOf,
  createQuery,
  useMonitor,
  useWorld,
} from "@javelin/ecs"
import { Player, Position, Rotation } from "javelin-fps-shared"
import { Quaternion } from "three"
import { Client } from "../../net"
import { createStackPool } from "../../pool"
import { Interp } from "../schema"
import { messageHandler } from "../world"

const qryDynamicControlled = createQuery(Position, Rotation, Player).not(Interp)
const qryDynamicUncontrolled = createQuery(Position, Rotation).not(Player)
const qryInterp = createQuery(Interp, Position, Rotation)
const tempQuatFrom = new Quaternion()
const tempQuatTo = new Quaternion()

const interpPool = createStackPool(
  () => [0, 0, 0, 0, 0, 0, 0, 0],
  record => {
    record[0] = 0
    record[1] = 0
    record[2] = 0
    record[3] = 0
    record[4] = 0
    record[5] = 0
    record[6] = 0
    record[7] = 0
    return record
  },
  1000,
)

function interpolate(now: number, interp: ComponentOf<typeof Interp>) {
  const renderTime = now - interp.adaptiveSendRate
  // Drop older positions.
  while (interp.buffer.length >= 2 && interp.buffer[1][0] <= renderTime) {
    interpPool.release(interp.buffer.shift())
  }
  if (
    interp.buffer.length >= 2 &&
    interp.buffer[0][0] <= renderTime &&
    renderTime <= interp.buffer[1][0]
  ) {
    const [
      [t0, x0, y0, z0, qx0, qy0, qz0, qw0],
      [t1, x1, y1, z1, qx1, qy1, qz1, qw1],
    ] = interp.buffer
    const dr = renderTime - t0
    const dt = t1 - t0
    // interpolate position
    interp.x = x0 + ((x1 - x0) * dr) / dt
    interp.y = y0 + ((y1 - y0) * dr) / dt
    interp.z = z0 + ((z1 - z0) * dr) / dt
    // interpolate rotation
    tempQuatTo.set(qx0, qy0, qz0, qw0)
    tempQuatFrom.set(qx1, qy1, qz1, qw1)
    tempQuatTo.slerp(tempQuatFrom, dr / dt)
    interp.qx = tempQuatTo.x
    interp.qy = tempQuatTo.y
    interp.qz = tempQuatTo.z
    interp.qw = tempQuatTo.w
    interp.adaptiveSendRate = (interp.adaptiveSendRate + dt) / 2
  }
}

function createInterp(
  position: ComponentOf<typeof Position>,
  rotation: ComponentOf<typeof Rotation>,
) {
  return component(Interp, {
    adaptiveSendRate: (1 / 30) * 1000,
    x: position.x,
    y: position.y,
    z: position.z,
    qx: rotation.x,
    qy: rotation.y,
    qz: rotation.z,
    qw: rotation.w,
  })
}

export function sysInterp() {
  const { attach, detach, get, latestStepData } = useWorld()
  const { updated } = messageHandler.useInfo()
  const now = performance.now()

  useMonitor(
    qryDynamicUncontrolled,
    (e, [p, q]) => attach(e, createInterp(p, q)),
    e => detach(e, get(e, Interp)),
  )
  useMonitor(
    qryDynamicControlled,
    (e, [p, q, pl]) =>
      pl.clientId !== (latestStepData as Client).id &&
      attach(e, createInterp(p, q)),
    e => detach(e, get(e, Interp)),
  )

  qryInterp(function insertBufferRecord(e, [interp, t, q]) {
    if (updated.has(e)) {
      const record = interpPool.retain()
      const now = performance.now()
      record[0] = now
      record[1] = t.x
      record[2] = t.y
      record[3] = t.z
      record[4] = q.x
      record[5] = q.y
      record[6] = q.z
      record[7] = q.w
      interp.buffer.push(record)
    }
  })

  qryInterp((e, [interp]) => interpolate(now, interp))
}
