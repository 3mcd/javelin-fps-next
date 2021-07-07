import type { RigidBody } from "@dimforge/rapier3d"
import { InputSample } from "./types"

export function applyInputSample(sample: InputSample, body: RigidBody) {
  const z = sample[2] - sample[0]
  const x = sample[1] - sample[3]
  const velocity = body.linvel()
  const rotation = body.rotation()
  if (z || x) {
    const angle = Math.atan2(x, z)
    rotation.x = 0
    rotation.y = 1 * Math.sin(angle / 2)
    rotation.z = 0
    rotation.w = Math.cos(angle / 2)
    velocity.x = x * 10
    velocity.z = z * 10
    body.setLinvel(velocity, true)
    body.setRotation(rotation, true)
  }
}
