import { createQuery } from "@javelin/ecs"
import { Player, Position, InputSample } from "javelin-fps-shared"
import { useClients, useRigidBodies } from "../effects"
import * as Rapier from "@a-type/rapier3d-node"

const qryPlayers = createQuery(Player, Position)

// TODO(3mcd): extract to shared lib
function applyInput(sample: InputSample, rigidBody: any) {
  const x = (sample[0] - sample[2]) / 8
  const z = (sample[1] - sample[3]) / 8
  const linvel = rigidBody.linvel()
  rigidBody.setLinvel(
    new Rapier.Vector3(linvel.x + x, linvel.y, linvel.z + z),
    true,
  )
  if (sample[4]) {
    rigidBody.applyImpulse(new Rapier.Vector3(0, 1, 0), true)
  }
}

export function sysInput() {
  const clients = useClients()
  const rigidBodies = useRigidBodies()
  qryPlayers((e, [p]) => {
    const client = clients.get(p.clientId)
    if (client === undefined) return
    const rigidBody = rigidBodies.get(e)
    // buffering, replay latest input
    if (client.inputs.length <= 2) {
      const sample = client.latestInput || client.inputs[0]
      if (sample && rigidBody) {
        applyInput(sample, rigidBody)
        client.latestInput = sample
      }
    } else {
      while (client.inputs.length > 2) {
        const sample = client.inputs.shift()
        if (sample && rigidBody) {
          applyInput(sample, rigidBody)
          client.latestInput = sample
        }
      }
    }
  })
}
