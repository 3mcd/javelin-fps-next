import * as Rapier from "@a-type/rapier3d-node"
import { createQuery } from "@javelin/ecs"
import { InputSample, Player, Position } from "javelin-fps-shared"
import { useBodies, useClients } from "../effects"

const qryPlayers = createQuery(Player, Position)

function applyInput(sample: InputSample, body: Rapier.RigidBody) {
  const z = sample[2] - sample[0]
  const x = sample[1] - sample[3]
  const velocity = body.linvel()
  const rotation = body.rotation()
  const angle = Math.atan2(x, z)
  rotation.x = 0
  rotation.y = 1 * Math.sin(angle / 2)
  rotation.z = 0
  rotation.w = Math.cos(angle / 2)
  velocity.x = x * 25
  velocity.z = z * 25
  body.setLinvel(velocity, true)
  body.setRotation(rotation, true)
}

export function sysInput() {
  const clients = useClients()
  const bodies = useBodies()
  qryPlayers((e, [p]) => {
    const client = clients.get(p.clientId)
    if (client === undefined) return
    const body = bodies.get(e)
    if (body) {
      const velocity = body.linvel()
      velocity.y = -9.81
      body.setLinvel(velocity, true)
    }
    while (client.inputs.length) {
      const sample = client.inputs.shift()
      if (sample && body) {
        applyInput(sample, body)
        client.latestInput = sample
      }
    }
    const translation = body?.translation()
    if (translation?.y < 1) {
      translation.y = 1
      body.setTranslation(translation, true)
    }
  })
}
