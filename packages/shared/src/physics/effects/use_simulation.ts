import type { World as RapierWorld } from "@dimforge/rapier3d"
import { createImmutableRef, World } from "@javelin/ecs"
import { WorldTickData } from "../types"

export const useSimulation = createImmutableRef(
  (world: World<WorldTickData>): RapierWorld => {
    const { BodyStatus, ColliderDesc, RigidBodyDesc, Vector3, World } =
      world.latestTickData.Rapier
    const physics = new World(new Vector3(0, -9.81, 0))
    const groundRigidBodyDesc = new RigidBodyDesc(BodyStatus.Static)
    const groundRigidBody = physics.createRigidBody(groundRigidBodyDesc)
    const groundColliderDesc = ColliderDesc.cuboid(1000, 0, 1000)
    physics.createCollider(groundColliderDesc, groundRigidBody.handle)
    return physics
  },
  { shared: true },
)
