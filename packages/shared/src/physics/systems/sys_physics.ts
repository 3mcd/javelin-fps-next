import type * as Rapier from "@dimforge/rapier3d"
import { ComponentOf, createQuery, useMonitor, useWorld } from "@javelin/ecs"
import { Player, Position, Rotation, Velocity } from "../../schema"
import { useBodies, useSimulation } from "../effects"
import { RapierLib, WorldTickData } from "../types"

const qryStatic = createQuery(Position, Rotation).not(Velocity)
const qryDynamic = createQuery(Position, Rotation, Velocity)

function createBoxBody(
  Rapier: RapierLib,
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
  Rapier: RapierLib,
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
  const {
    has,
    latestTickData: { Rapier: RapierLib },
  } = useWorld<WorldTickData>()
  const physics = useSimulation()
  const dynamic = useBodies()
  // create dynamic rigid bodies
  useMonitor(
    qryDynamic,
    function addDynamicRigidBody(e, [t, q, v]) {
      dynamic.set(
        e,
        (has(e, Player) ? createPlayerBody : createBoxBody)(
          RapierLib,
          physics,
          t,
          q,
          v,
        ),
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
    createBoxBody(RapierLib, physics, t, q)
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
