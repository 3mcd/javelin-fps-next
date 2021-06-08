import "@javelin/core"
import { registerSchema } from "@javelin/ecs"
import { float64, string16, StringView } from "@javelin/pack"

export const Player = { clientId: { ...string16, length: 32 } as StringView }
export const Position = { x: float64, y: float64, z: float64 }
export const Rotation = { x: float64, y: float64, z: float64, w: float64 }
export const Velocity = { x: float64, y: float64, z: float64 }
export const Wall = { test: float64 }
export const Sun = { inclination: float64, azimuth: float64 }

registerSchema(Player, 0)
registerSchema(Position, 1)
registerSchema(Rotation, 2)
registerSchema(Velocity, 3)
registerSchema(Wall, 4)
registerSchema(Sun, 5)
