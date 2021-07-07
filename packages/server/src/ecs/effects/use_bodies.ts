import { RigidBody } from "@a-type/rapier3d-node"
import { createImmutableRef, Entity } from "@javelin/ecs"

export const useBodies = createImmutableRef(
  () => new Map<Entity, RigidBody>(),
  { shared: true },
)
