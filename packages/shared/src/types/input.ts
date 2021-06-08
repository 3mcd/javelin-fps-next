export type ButtonState = 0 | 1
export type InputSample = [
  up: ButtonState,
  right: ButtonState,
  down: ButtonState,
  left: ButtonState,
  jump: ButtonState,
  pointerX: number,
  pointerY: number,
  tick: number,
]
