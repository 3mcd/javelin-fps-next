import * as Rapier from "@a-type/rapier3d-node"
import {
  ComponentOf,
  createImmutableRef,
  createQuery,
  useInterval,
  useMonitor,
  useWorld,
} from "@javelin/ecs"
import { Player, Position, Rotation, Velocity } from "javelin-fps-shared"
import { useBodies } from "../effects"
const qryStatic = createQuery(Position, Rotation).not(Velocity)
const qryDynamic = createQuery(Position, Rotation, Velocity)
const qryBoxes = createQuery(Position, Rotation, Velocity).not(Player)

export const useRapier = createImmutableRef(
  () => {
    const world = new Rapier.World(new Rapier.Vector3(0, -9.81, 0))
    const groundRigidBodyDesc = new Rapier.RigidBodyDesc(
      Rapier.BodyStatus.Static,
    )
    const groundRigidBody = world.createRigidBody(groundRigidBodyDesc)
    const groundColliderDesc = Rapier.ColliderDesc.cuboid(1000, 0, 1000)
    world.createCollider(groundColliderDesc, groundRigidBody.handle)
    return world
  },
  { shared: true },
)

function createBoxBody(
  world: Rapier.World,
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
  world.createCollider(
    Rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5).setDensity(2.0),
    body.handle,
  )
  return body
}

function createPlayerBody(
  world: Rapier.World,
  { x, y, z }: ComponentOf<typeof Position>,
  { x: qx, y: qy, z: qz, w: qw }: ComponentOf<typeof Rotation>,
  velocity: ComponentOf<typeof Velocity>,
) {
  const bodyDesc = Rapier.RigidBodyDesc.newKinematicVelocityBased()
    .setTranslation(x, y, z)
    .setRotation(new Rapier.Quaternion(qx, qy, qz, qw))
  if (velocity) {
    bodyDesc.setLinvel(velocity.x, velocity.y, velocity.z)
  }
  const body = world.createRigidBody(bodyDesc)
  world.createCollider(
    Rapier.ColliderDesc.ball(0.5).setDensity(2.0),
    body.handle,
  )
  return body
}

export function sysPhysics() {
  const { has } = useWorld()
  const physics = useRapier()
  const dynamic = useBodies()
  // create dynamic rigid bodies
  useMonitor(
    qryDynamic,
    function addDynamicRigidBody(e, [t, q, v]) {
      dynamic.set(
        e,
        (has(e, Player) ? createPlayerBody : createBoxBody)(physics, t, q, v),
      )
    },
    function cleanupDynamicRigidBody(e) {
      const body = dynamic.get(e)
      physics.removeRigidBody(body)
      dynamic.delete(e)
    },
  )
  // create static rigid bodies
  useMonitor(qryStatic, function addStaticRigidBody(e, [t, q]) {
    createBoxBody(physics, t, q)
  })
  // step simulation
  physics.step()
  // update dynamic components
  qryDynamic(function syncDynamicEntity(e, [t, q]) {
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
  const dynamic = useBodies()
  if (useInterval(5000)) {
    qryBoxes(e => {
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
