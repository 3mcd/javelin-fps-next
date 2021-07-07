import type { RigidBody } from "@dimforge/rapier3d"
import { createImmutableRef, Entity } from "@javelin/ecs"

export const useBodies = createImmutableRef(
  () => new Map<Entity, RigidBody>(),
  { shared: true },
)
