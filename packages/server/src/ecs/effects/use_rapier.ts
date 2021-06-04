import {
  World,
  Vector3,
  ColliderDesc,
  RigidBodyDesc,
  BodyStatus,
} from "@a-type/rapier3d-node"
import { createRef } from "@javelin/ecs"

export const useWorld = createRef(() => {
  const world = new World(new Vector3(0, -9.81, 0))
  const groundRigidBodyDesc = new RigidBodyDesc(BodyStatus.Static)
  const groundRigidBody = world.createRigidBody(groundRigidBodyDesc)
  const groundColliderDesc = ColliderDesc.cuboid(5, 0.1, 5)
  world.createCollider(groundColliderDesc, groundRigidBody.handle)
  return world
})
export const useRapier = () => {
  const world = useWorld()
  return world.value
}
