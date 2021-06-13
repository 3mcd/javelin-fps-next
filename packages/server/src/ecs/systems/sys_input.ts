import { createQuery } from "@javelin/ecs"
import { Player, Position, InputSample } from "javelin-fps-shared"
import { useClients, useRigidBodies } from "../effects"
import * as Rapier from "@a-type/rapier3d-node"
import { useRapier } from "./sys_physics"

const ZERO = new Rapier.Vector3(0, 0, 0)
const CYLINDER = new Rapier.Cylinder(1, 1)

const AXIS_X = new Rapier.Vector3(1, 0, 0)
const AXIS_Y = new Rapier.Vector3(0, 1, 0)

const tmpVecVel = new Rapier.Vector3()
const tmpQuatVel = new Rapier.Quaternion()
const tmpQuatLat = new Rapier.Quaternion()
const tmpQuatLon = new Rapier.Quaternion()

const qryPlayers = createQuery(Player, Position)

function length(quat: any) {
  return Math.sqrt(
    quat.x * quat.x + quat.y * quat.y + quat.z * quat.z + quat.w * quat.w,
  )
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js#L470
function normalize(quat: any) {
  let l = length(quat)
  if (l === 0) {
    quat._x = 0
    quat._y = 0
    quat._z = 0
    quat._w = 1
  } else {
    l = 1 / l
    quat._x = quat._x * l
    quat._y = quat._y * l
    quat._z = quat._z * l
    quat._w = quat._w * l
  }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js#L517
function multiply(a: any, b: any) {
  const qax = a.x,
    qay = a.y,
    qaz = a.z,
    qaw = a.w
  const qbx = b.x,
    qby = b.y,
    qbz = b.z,
    qbw = b.w
  a.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby
  a.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz
  a.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx
  a.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js#L286
function setFromAxisAngle(quat: any, axis: any, angle: number) {
  const halfAngle = angle / 2
  const s = Math.sin(halfAngle)
  quat.x = axis.x * s
  quat.y = axis.y * s
  quat.z = axis.z * s
  quat.w = Math.cos(halfAngle)
}

// https://github.com/pmndrs/cannon-es/blob/master/src/math/Quaternion.ts#L202
function vmult(vec: any, quat: any) {
  const x = vec.x
  const y = vec.y
  const z = vec.z
  const qx = quat.x
  const qy = quat.y
  const qz = quat.z
  const qw = quat.w
  // q*v
  const ix = qw * x + qy * z - qz * y
  const iy = qw * y + qz * x - qx * z
  const iz = qw * z + qx * y - qy * x
  const iw = -qx * x - qy * y - qz * z
  quat.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
  quat.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
  quat.z = iz * qw + iw * -qz + ix * -qy - iy * -qx
}

// TODO(3mcd): extract to shared lib
function applyInput(sample: InputSample, rigidBody: any, world: any) {
  rigidBody.setLinvel(new Rapier.Vector3(0, -9.81, 0))
  const pointerX = sample[5]
  const pointerY = sample[6]
  if (pointerX || pointerY) {
    setFromAxisAngle(tmpQuatLat, AXIS_X, pointerY)
    setFromAxisAngle(tmpQuatLon, AXIS_Y, pointerX)
    multiply(tmpQuatLon, tmpQuatLat)
    normalize(tmpQuatLon)
    rigidBody.setRotation(tmpQuatLon)
  }
  const z = sample[2] - sample[0]
  const x = sample[1] - sample[3]
  const linvel = rigidBody.linvel()
  const rotation = rigidBody.rotation()
  tmpVecVel.x = x
  tmpVecVel.y = 0
  tmpVecVel.z = z
  tmpQuatVel.x = rotation.x
  tmpQuatVel.y = rotation.y
  tmpQuatVel.z = rotation.z
  tmpQuatVel.w = rotation.w
  vmult(tmpVecVel, tmpQuatVel)
  linvel.x += tmpQuatVel.x * 10
  linvel.z += tmpQuatVel.z * 10
  if (sample[4]) {
    // (self * a) + b
    linvel.y = -9.81 * (1 / 60) + 20
  }
  rigidBody.setLinvel(linvel, true)
}

export function sysInput() {
  const clients = useClients()
  const rigidBodies = useRigidBodies()
  const physics = useRapier()
  qryPlayers((e, [p]) => {
    const client = clients.get(p.clientId)
    if (client === undefined) return
    const rigidBody = rigidBodies.get(e)
    // buffering, replay latest input
    if (client.inputs.length <= 2) {
      const sample = client.latestInput || client.inputs[0]
      if (sample && rigidBody) {
        applyInput(sample, rigidBody, physics)
        client.latestInput = sample
      }
    } else {
      while (client.inputs.length > 2) {
        const sample = client.inputs.shift()
        if (sample && rigidBody) {
          applyInput(sample, rigidBody, physics)
          client.latestInput = sample
        }
      }
    }
    const translation = rigidBody?.translation()
    if (translation?.y < 0.5) {
      translation.y = 0.5
      rigidBody.setTranslation(translation)
    }
  })
}
