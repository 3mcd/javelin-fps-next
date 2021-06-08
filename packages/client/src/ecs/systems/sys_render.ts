import {
  ComponentOf,
  createEffect,
  createQuery,
  Entity,
  useMonitor,
  useWorld,
} from "@javelin/ecs"
import {
  createImmutableRef,
  Player,
  Position,
  Rotation,
  Wall,
} from "javelin-fps-shared"
import {
  BoxGeometry,
  Camera,
  Material,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  Renderer,
  Scene,
} from "three"
import { useScene } from "../effects"
import { Interp } from "../schema"

const materials = {
  cube: new MeshLambertMaterial({
    color: 0xff0000,
  }),
  wall: new MeshLambertMaterial({
    color: 0xffffff,
  }),
}
const geometries = {
  box: new BoxGeometry(),
}
const quaternion = new Quaternion()

const qryWalls = createQuery(Position, Rotation, Wall)
const qryBodies = createQuery(Position, Rotation).not(Wall)
const qryInterp = createQuery(Interp, Rotation)

const useMeshes = createImmutableRef(() => new Map<Entity, Mesh>(), {
  global: true,
})
const useRenderLoop = createEffect(() => {
  let _renderer: Renderer
  let _scene: Scene
  let _camera: Camera
  let running = false
  const api = {
    start() {
      if (!running) {
        running = true
        requestAnimationFrame(loop)
      }
    },
    stop() {
      if (running) running = false
    },
  }
  function loop() {
    if (!running) return
    if (_renderer) {
      _renderer.render(_scene, _camera)
    }
    requestAnimationFrame(loop)
  }
  api.start()
  return function useRenderLoop(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
  ) {
    _renderer = renderer
    _scene = scene
    _camera = camera
    return api
  }
})

function createBoxMesh(
  material: Material,
  position: ComponentOf<typeof Position>,
  rotation: ComponentOf<typeof Rotation>,
) {
  const geometry = geometries.box
  const mesh = new Mesh(geometry, material)
  mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.position.x = position.x
  mesh.position.y = position.y
  mesh.position.z = position.z
  quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  mesh.setRotationFromQuaternion(quaternion)
  return mesh
}

export function sysRender() {
  const { scene, camera, controls, renderer } = useScene()
  const meshes = useMeshes()
  const cleanup = (e: Entity) => {
    const mesh = meshes.get(e)
    scene.remove(mesh)
    meshes.delete(e)
  }
  useRenderLoop(renderer, scene, camera)
  useMonitor(
    qryBodies,
    (e, [t, q]) => {
      const mesh = createBoxMesh(materials.cube, t, q)
      scene.add(mesh)
      meshes.set(e, mesh)
    },
    cleanup,
  )
  useMonitor(
    qryWalls,
    (e, [t, q]) => {
      const mesh = createBoxMesh(materials.wall, t, q)
      scene.add(mesh)
      meshes.set(e, mesh)
    },
    cleanup,
  )
  qryInterp(function copyTransformToMesh(e, [interp]) {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      mesh.position.x = interp.x
      mesh.position.y = interp.y
      mesh.position.z = interp.z
      quaternion.set(interp.qx, interp.qy, interp.qz, interp.qw)
      mesh.setRotationFromQuaternion(quaternion)
    }
  })
  controls.update()
}

const qryPlayerBodies = createQuery(Player, Interp)

export function sysRenderCamera() {
  const { latestStepData } = useWorld()
  const { camera } = useScene()
  qryPlayerBodies(function lookAtPlayerActor(e, [p, { x, y, z }]) {
    if (p.clientId === latestStepData) {
      camera.lookAt(x, y, z)
    }
  })
}
