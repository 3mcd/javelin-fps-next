import { createEffect, EffectOptions, useRef, World } from "@javelin/ecs"

export type RefInitializer<T> = (world: World) => T

export function createImmutableRef<T>(
  initializer: RefInitializer<T>,
  options: EffectOptions = {},
) {
  return createEffect(world => {
    const initialValue = initializer(world)
    return () => useRef(initialValue).value
  }, options)
}
