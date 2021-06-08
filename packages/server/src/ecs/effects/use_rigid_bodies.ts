import { Entity } from "@javelin/ecs"
import { createImmutableRef } from "javelin-fps-shared"

export const useRigidBodies = createImmutableRef(() => new Map<Entity, any>(), {
  global: true,
})
