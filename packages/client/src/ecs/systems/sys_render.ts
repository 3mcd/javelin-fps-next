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
  Sun,
  Wall,
} from "javelin-fps-shared"
import {
  BoxGeometry,
  Camera,
  Material,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  Quaternion,
  Renderer,
  Scene,
  Vector3,
} from "three"
import { Client } from "../../net"
import { createSky } from "../../three/sky"
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
const tmpRotation = new Quaternion()

const qrySun = createQuery(Sun)
const qryWalls = createQuery(Position, Rotation, Wall)
const qryBodies = createQuery(Position, Rotation).not(Wall)
const qryInterp = createQuery(Interp, Rotation).not(Wall)
const qryCoarse = createQuery(Position, Rotation).not(Interp)
const qryPlayerActors = createQuery(Player, Position)

const useMeshes = createImmutableRef(() => new Map<Entity, Mesh>(), {
  global: true,
})
const useRenderLoop = createEffect(() => {
  let _renderer: Renderer
  let _scene: Scene
  let _camera: Camera
  let _target: ComponentOf<typeof Position>
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
    _renderer?.render(_scene, _camera)
    requestAnimationFrame(loop)
  }
  api.start()
  return function useRenderLoop(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    target?: ComponentOf<typeof Position>,
  ) {
    _renderer = renderer
    _scene = scene
    _camera = camera
    _target = target
    if (_target) {
      const { x, y, z } = _target
      _camera.position.set(x, y + 30, z + 20)
      _camera.lookAt(x, y, z)
    }
    return api
  }
})

function createBoxMesh(
  material: Material,
  { x, y, z }: ComponentOf<typeof Position>,
  rotation: ComponentOf<typeof Rotation>,
) {
  const mesh = new Mesh(geometries.box, material)
  mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.position.set(x, y, z)
  tmpRotation.set(rotation.x, rotation.y, rotation.z, rotation.w)
  mesh.setRotationFromQuaternion(tmpRotation)
  return mesh
}

export function sysRender() {
  const { latestStepData } = useWorld()
  const { scene, camera, renderer } = useScene()
  const meshes = useMeshes()
  function cleanup(e: Entity) {
    const mesh = meshes.get(e)
    scene.remove(mesh)
    meshes.delete(e)
  }
  let target: ComponentOf<typeof Position> | undefined
  qryPlayerActors(function lookAtPlayerActor(e, [{ clientId }, p]) {
    if (clientId === (latestStepData as Client)?.id) {
      target = p
    }
  })
  useMonitor(
    qryBodies,
    function addBoxToScene(e, [t, q]) {
      const mesh = createBoxMesh(materials.cube, t, q)
      scene.add(mesh)
      meshes.set(e, mesh)
    },
    cleanup,
  )
  useMonitor(
    qryWalls,
    function addWallToScene(e, [t, q]) {
      const mesh = createBoxMesh(materials.wall, t, q)
      scene.add(mesh)
      meshes.set(e, mesh)
    },
    cleanup,
  )
  qryCoarse(function copyTransformToMesh(e, [{ x, y, z }, q]) {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      mesh.position.set(x, y, z)
      tmpRotation.set(q.x, q.y, q.z, q.w)
      mesh.setRotationFromQuaternion(tmpRotation)
    }
  })
  qryInterp(function copyInterpolatedTransformToMesh(e, [interp]) {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      const { x, y, z, qx, qy, qz, qw } = interp
      mesh.position.set(x, y, z)
      tmpRotation.set(qx, qy, qz, qw)
      mesh.setRotationFromQuaternion(tmpRotation)
    }
  })
  useRenderLoop(renderer, scene, camera, target)
}

const useSky = createImmutableRef(() => {
  const sky = createSky()
  sky.scale.setScalar(450000)
  return sky
})
export function sysRenderSky() {
  const { scene } = useScene()
  const mesh = useSky()
  useMonitor(qrySun, function addSkyToScene() {
    mesh.material.uniforms.turbidity.value = 1.25
    mesh.material.uniforms.rayleigh.value = 1
    mesh.material.uniforms.mieCoefficient.value = 0.00335
    mesh.material.uniforms.mieDirectionalG.value = 0.787
    scene.add(mesh)
  })
  qrySun(function updateSunPosition(_, [sun]) {
    const { inclination, azimuth } = sun
    const theta = Math.PI * (inclination - 0.5)
    const phi = 2 * Math.PI * (azimuth - 0.5)
    const sinPhi = Math.sin(phi)
    const sunX = Math.cos(phi)
    const sunY = sinPhi * Math.sin(theta)
    const sunZ = sinPhi * Math.cos(theta)
    mesh.material.uniforms.sunPosition.value.set(sunX, sunY, sunZ)
  })
}
