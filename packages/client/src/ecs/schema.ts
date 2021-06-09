import { arrayOf, number } from "@javelin/core"

export const Interp = {
  x: number,
  y: number,
  z: number,
  qx: number,
  qy: number,
  qz: number,
  qw: number,
  adaptiveSendRate: number,
  buffer: arrayOf(arrayOf(number)),
}
