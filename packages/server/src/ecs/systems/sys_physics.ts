import * as Rapier from "@a-type/rapier3d-node"
import {
  ComponentOf,
  createQuery,
  Entity,
  useInterval,
  useMonitor,
} from "@javelin/ecs"
import {
  createImmutableRef,
  Position,
  Rotation,
  Velocity,
} from "javelin-fps-shared"
const qryStatic = createQuery(Position, Rotation).not(Velocity)
const qryDynamic = createQuery(Position, Rotation, Velocity)

export const useRapier = createImmutableRef(() => {
  const world = new Rapier.World(new Rapier.Vector3(0, -9.81, 0))
  const groundRigidBodyDesc = new Rapier.RigidBodyDesc(Rapier.BodyStatus.Static)
  const groundRigidBody = world.createRigidBody(groundRigidBodyDesc)
  const groundColliderDesc = Rapier.ColliderDesc.cuboid(1000, 0, 1000)
  world.createCollider(groundColliderDesc, groundRigidBody.handle)
  return world
})

const useRigidBodies = createImmutableRef(() => new Map<Entity, any>(), {
  global: true,
})

function createBoxBody(
  world: any,
  { x, y, z }: ComponentOf<typeof Position>,
  { x: qx, y: qy, z: qz, w: qw }: ComponentOf<typeof Rotation>,
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
  const dynamic = useRigidBodies()
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

export function sysPhysicsBounce() {
  const dynamic = useRigidBodies()
  // bounce!
  if (useInterval(5000)) {
    qryDynamic(e => {
      const body = dynamic.get(e)
      const impulse = new Rapier.Vector3(
        (0.5 - Math.random()) * 10,
        15,
        (0.5 - Math.random()) * 10,
      )
      body.applyImpulse(impulse, true)
    })
  }
}
