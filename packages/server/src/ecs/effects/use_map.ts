import { createEffect, useRef } from "@javelin/ecs"
import { promises } from "fs"
import path from "path"
const { readFile } = promises

type EntityDescription = [name: string, attributes: Record<string, unknown>]
type Map = EntityDescription[]

export const useMap = createEffect(() => {
  const dir = process.env.MAPS_DIRECTORY || path.resolve(process.cwd(), "maps")
  const init = Promise.resolve([] as Map)
  return async function useMap(name: string) {
    const current = useRef("")
    const promise = useRef(init)
    if (current.value !== name) {
      current.value = name
      promise.value = readFile(`${dir}/${name}.json`, {
        encoding: "utf8",
      }).then<Map>(JSON.parse)
    }
    return promise.value
  }
})
