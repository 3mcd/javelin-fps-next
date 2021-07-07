import { createQuery } from "@javelin/ecs"
import {
  applyInputSample,
  Player,
  Position,
  useBodies,
} from "javelin-fps-shared"
import { useClients } from "../effects"

const qryPlayers = createQuery(Player, Position)

export function sysInput() {
  const clients = useClients()
  const bodies = useBodies()
  qryPlayers((e, [p]) => {
    const client = clients.get(p.clientId)
    if (client === undefined) return
    const body = bodies.get(e)
    if (body) {
      // apply gravity
      const velocity = body.linvel()
      velocity.y = -9.81
      body.setLinvel(velocity, true)
      // handle collisions
      const translation = body.translation()
      if (translation.y < 1) {
        translation.y = 1
        body.setTranslation(translation, true)
      }
    }
    // handle client input
    const { input } = client
    const delta = input.buffer.length - input.rate
    if (delta > 3) {
      // (approach infinity) client is over-sending input
      input.rate++
    } else {
      input.rate = Math.max(
        delta < 0
          ? 0 // (approach zero) client is under-sending input
          : 1, // (approach one) client is sending at proper rate
        input.rate - 1,
      )
    }
    if (input.rate === 0 || input.buffer.length === 0) {
      if (input.latestSample && body) {
        applyInputSample(input.latestSample, body)
      }
    } else {
      const count = Math.min(input.rate, input.buffer.length)
      for (let i = 0; i < count; i++) {
        const sample = input.buffer.shift()
        if (body) applyInputSample(sample, body)
        input.latestSample = sample
      }
    }
  })
}
