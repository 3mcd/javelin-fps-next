import { createImmutableRef, useRef, useWorld } from "@javelin/ecs"
import { Gamepad, Keyboard, Mouse, or } from "contro"
import { ButtonState, InputSample } from "javelin-fps-shared"
import { createStackPool } from "../../pool"
import { inputTopic } from "../topics"

const SENSITIVITY = 0.002
const PI_2 = Math.PI / 2

const mouse = new Mouse({ canvas: document.querySelector("canvas") })
const keyboard = new Keyboard()
const gamepad = new Gamepad()
const controls = {
  up: or(gamepad.button("Up"), keyboard.key("W")),
  down: or(gamepad.button("Down"), keyboard.key("S")),
  left: or(gamepad.button("Left"), keyboard.key("A")),
  right: or(gamepad.button("Right"), keyboard.key("D")),
  jump: or(gamepad.button("A"), keyboard.key("Space")),
  pointer: mouse.pointer(),
}

const pool = createStackPool<InputSample>(
  () => [0, 0, 0, 0, 0, 0, 0, 0],
  sample => {
    sample[0] = 0
    sample[1] = 0
    sample[2] = 0
    sample[3] = 0
    sample[4] = 0
    sample[5] = 0
    sample[6] = 0
    sample[7] = 0
    return sample
  },
  50,
)

const useInputBuffer = createImmutableRef(() => [] as InputSample[])

type AnyControl = Parameters<typeof or>[0]

function toButtonState(control: AnyControl) {
  return +Boolean(control.query()) as ButtonState
}

export function sysInput() {
  const buffer = useInputBuffer()
  const { latestTick } = useWorld()
  const prevPointerX = useRef(0)
  const prevPointerY = useRef(0)
  const sample: InputSample = pool.retain()
  sample[0] = toButtonState(controls.up)
  sample[1] = toButtonState(controls.right)
  sample[2] = toButtonState(controls.down)
  sample[3] = toButtonState(controls.left)
  sample[4] = toButtonState(controls.jump)
  sample[5] = prevPointerX.value
  sample[6] = prevPointerY.value
  if (mouse.isPointerLocked()) {
    const { x, y } = controls.pointer.query()
    prevPointerX.value = sample[5] - x * SENSITIVITY
    prevPointerY.value = Math.max(
      -PI_2,
      Math.min(PI_2, sample[6] - y * SENSITIVITY),
    )
    sample[5] = prevPointerX.value
    sample[6] = prevPointerY.value
  }
  sample[7] = latestTick
  buffer.push(sample)
  while (buffer.length > 20) {
    pool.release(buffer.shift())
  }
  inputTopic.pushImmediate(sample)
}
