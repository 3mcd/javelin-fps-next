import {
  createQuery,
  createRef,
  Entity,
  useMonitor,
  useRef,
  useWorld,
} from "@javelin/ecs"
import {
  Color3,
  Engine,
  FreeCamera,
  HemisphericLight,
  Mesh,
  Quaternion as BabylonQuaternion,
  Scene,
  StandardMaterial,
  Vector3,
} from "babylonjs"
import { Quaternion, Transform, Wall } from "javelin-fps-shared"

const qryBodies = createQuery(Transform, Quaternion)

const useScene = createRef(() => {
  const canvas = document.getElementById("game") as HTMLCanvasElement
  const engine = new Engine(
    canvas,
    true,
    {
      preserveDrawingBuffer: true,
      stencil: true,
    },
    true,
  )
  const scene = new Scene(engine)
  const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene)
  camera.setTarget(Vector3.Zero())
  camera.attachControl(canvas, false)
  const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene)
  const ground = Mesh.CreateGround("ground1", 10, 10, 2, scene, false)
  engine.runRenderLoop(() => scene.render())
  return scene
})
const useMeshes = createRef(() => new Map<Entity, Mesh>())

export function sysRender() {
  const { has } = useWorld()
  const { value: meshes } = useMeshes()
  const { value: scene } = useScene()
  const boxMaterial = useRef<StandardMaterial | null>(null)
  useMonitor(
    qryBodies,
    (e, [t, q]) => {
      const box = Mesh.CreateBox("box1", 1, scene, true, Mesh.FRONTSIDE)
      const material = new StandardMaterial("boxMaterial", scene)
      material.diffuseColor = has(e, Wall)
        ? new Color3(1, 1, 1)
        : new Color3(1, 0, 1)
      box.material = material
      box.position.x = t.x
      box.position.y = t.y
      box.position.z = t.z
      box.rotationQuaternion = new BabylonQuaternion(q.x, q.y, q.z, q.w)
      meshes.set(e, box)
    },
    e => {
      const mesh = meshes.get(e)
      mesh.dispose()
      meshes.delete(e)
    },
  )
  qryBodies((e, [t, q]) => {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      mesh.position.x = t.x
      mesh.position.y = t.y
      mesh.position.z = t.z
      mesh.rotationQuaternion.x = q.x
      mesh.rotationQuaternion.y = q.y
      mesh.rotationQuaternion.z = q.z
      mesh.rotationQuaternion.w = q.w
    }
  })
}
