import * as Rapier from "@a-type/rapier3d-node"
import {
  ComponentOf,
  createQuery,
  createRef,
  Entity,
  useInterval,
  useMonitor,
} from "@javelin/ecs"
import { Quaternion, Transform, Velocity } from "javelin-fps-shared"
import { useRapier } from "../effects/use_rapier"

const qryStatic = createQuery(Transform, Quaternion).not(Velocity)
const qryDynamic = createQuery(Transform, Quaternion, Velocity)

const useDynamic = createRef(() => new Map<Entity, any>())

function createBoxBody(
  world: any,
  { x, y, z }: ComponentOf<typeof Transform>,
  { x: qx, y: qy, z: qz, w: qw }: ComponentOf<typeof Quaternion>,
  velocity?: ComponentOf<typeof Velocity>,
) {
  const bodyDesc = new Rapier.RigidBodyDesc(
    velocity ? Rapier.BodyStatus.Dynamic : Rapier.BodyStatus.Static,
  )
    .setTranslation(x, y, z)
    .setRotation(new Rapier.Quaternion(qx, qy, qz, qw))
  if (velocity) {
    bodyDesc.setLinvel(velocity.x, velocity.y, velocity.z)
  }
  const body = world.createRigidBody(bodyDesc)
  const colliderDesc = Rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5).setDensity(2.0)
  const collider = world.createCollider(colliderDesc, body.handle)
  return body
}

export function sysPhysics() {
  const physics = useRapier()
  const { value: dynamic } = useDynamic()
  // create dynamic rigid bodies
  useMonitor(
    qryDynamic,
    (e, [t, q, v]) => dynamic.set(e, createBoxBody(physics, t, q, v)),
    e => {
      const body = dynamic.get(e)
      physics.removeRigidBody(body)
      dynamic.delete(e)
    },
  )
  // create static rigid bodies
  useMonitor(qryStatic, (e, [t, q]) => createBoxBody(physics, t, q))
  // bounce!
  if (useInterval(5000)) {
    qryDynamic(e => {
      const body = dynamic.get(e)
      const impulse = new Rapier.Vector3(
        Math.random() * 2,
        10,
        Math.random() * 2,
      )
      body.applyImpulse(impulse, true)
    })
  }
  // step simulation
  physics.step()
  // update dynamic components
  qryDynamic((e, [t, q]) => {
    const body = dynamic.get(e)
    const { x, y, z } = body.translation()
    const { x: qx, y: qy, z: qz, w: qw } = body.rotation()
    t.x = x
    t.y = y
    t.z = z
    q.x = qx
    q.y = qy
    q.z = qz
    q.w = qw
  })
}
