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
const quaternion = new Quaternion()

const qrySun = createQuery(Sun)
const qryWalls = createQuery(Position, Rotation, Wall)
const qryBodies = createQuery(Position, Rotation).not(Wall)
const qryInterp = createQuery(Interp, Rotation)
const qryCoarse = createQuery(Position, Rotation).not(Interp)
const qryPlayerActors = createQuery(Player, Position, Rotation)

const useMeshes = createImmutableRef(() => new Map<Entity, Mesh>(), {
  global: true,
})
const useRenderLoop = createEffect(() => {
  let _renderer: Renderer
  let _scene: Scene
  let _camera: Camera
  let _cameraContainer: Object3D
  let _targetPosition: ComponentOf<typeof Position>
  let _targetRotation: ComponentOf<typeof Rotation>
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
      if (_targetPosition) {
        const { x, y, z } = _targetPosition
        _cameraContainer.position.x = x
        _cameraContainer.position.y = y
        _cameraContainer.position.z = z
      }
      if (_targetRotation) {
        _cameraContainer.quaternion.set(
          _targetRotation.x,
          _targetRotation.y,
          _targetRotation.z,
          _targetRotation.w,
        )
      }
      _renderer.render(_scene, _camera)
    }
    requestAnimationFrame(loop)
  }
  api.start()
  return function useRenderLoop(
    renderer: Renderer,
    scene: Scene,
    camera: Camera,
    cameraContainer: Object3D,
    targetPosition?: ComponentOf<typeof Position>,
    targetRotation?: ComponentOf<typeof Rotation>,
  ) {
    _renderer = renderer
    _scene = scene
    _camera = camera
    _cameraContainer = cameraContainer
    _targetPosition = targetPosition
    _targetRotation = targetRotation
    return api
  }
})

function createBoxMesh(
  material: Material,
  { x, y, z }: ComponentOf<typeof Position>,
  rotation: ComponentOf<typeof Rotation>,
) {
  const geometry = geometries.box
  const mesh = new Mesh(geometry, material)
  mesh.receiveShadow = true
  mesh.castShadow = true
  mesh.position.x = x
  mesh.position.y = y
  mesh.position.z = z
  quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  mesh.setRotationFromQuaternion(quaternion)
  return mesh
}

export function sysRender() {
  const { latestStepData } = useWorld()
  const { scene, camera, cameraContainer, renderer } = useScene()
  const meshes = useMeshes()
  const cleanup = (e: Entity) => {
    const mesh = meshes.get(e)
    scene.remove(mesh)
    meshes.delete(e)
  }
  let cameraTargetPosition: ComponentOf<typeof Position> | undefined
  let cameraTargetRotation: ComponentOf<typeof Rotation> | undefined
  qryPlayerActors(function lookAtPlayerActor(e, [{ clientId }, p, r]) {
    if (clientId === (latestStepData as Client)?.id) {
      cameraTargetPosition = p
      cameraTargetRotation = r
    }
  })
  useRenderLoop(
    renderer,
    scene,
    camera,
    cameraContainer,
    cameraTargetPosition,
    cameraTargetRotation,
  )
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
  qryCoarse(function copyTransformToMesh(e, [p, q]) {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      mesh.position.x = p.x
      mesh.position.y = p.y
      mesh.position.z = p.z
      quaternion.set(q.x, q.y, q.z, q.w)
      mesh.setRotationFromQuaternion(quaternion)
    }
  })
  qryInterp(function copyInterpolatedTransformToMesh(e, [interp]) {
    const mesh = meshes.get(e)
    if (mesh !== undefined) {
      mesh.position.x = interp.x
      mesh.position.y = interp.y
      mesh.position.z = interp.z
      quaternion.set(interp.qx, interp.qy, interp.qz, interp.qw)
      mesh.setRotationFromQuaternion(quaternion)
    }
  })
}

const useSky = createImmutableRef(() => {
  const sky = createSky()
  sky.scale.setScalar(450000)
  return sky
})
export function sysRenderSky() {
  const { scene } = useScene()
  const mesh = useSky()
  useMonitor(qrySun, _ => {
    mesh.material.uniforms.turbidity.value = 1.25
    mesh.material.uniforms.rayleigh.value = 1
    mesh.material.uniforms.mieCoefficient.value = 0.00335
    mesh.material.uniforms.mieDirectionalG.value = 0.787
    scene.add(mesh)
  })
  qrySun((_, [sun]) => {
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
