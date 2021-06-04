import "@javelin/core"
import { registerSchema } from "@javelin/ecs"
import { float64, string16, StringView } from "@javelin/pack"

export const Player = { clientId: { ...string16, length: 16 } as StringView }
export const Transform = { x: float64, y: float64, z: float64 }
export const Quaternion = { x: float64, y: float64, z: float64, w: float64 }
export const Velocity = { x: float64, y: float64, z: float64 }
export const Wall = { test: float64 }

registerSchema(Player, 0)
registerSchema(Transform, 1)
registerSchema(Quaternion, 2)
registerSchema(Velocity, 3)
registerSchema(Wall, 4)
