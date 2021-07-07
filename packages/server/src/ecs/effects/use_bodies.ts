import { RigidBody } from "@a-type/rapier3d-node"
import { Entity } from "@javelin/ecs"
import { createImmutableRef } from "javelin-fps-shared"

export const useBodies = createImmutableRef(
  () => new Map<Entity, RigidBody>(),
  {
    global: true,
  },
)
