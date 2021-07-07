import { createImmutableRef } from "javelin-fps-shared"
import {
  ACESFilmicToneMapping,
  AxesHelper,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneBufferGeometry,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from "three"

export const useScene = createImmutableRef(
  () => {
    const canvas = document.getElementById("game") as HTMLCanvasElement
    const renderer = new WebGLRenderer({ antialias: true, canvas })
    const scene = new Scene()
    const camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2000000,
    )

    scene.add(camera)

    renderer.outputEncoding = sRGBEncoding
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = PCFSoftShadowMap

    scene.add(new AxesHelper(5))

    scene.background = new Color().setHSL(0.6, 0, 1)
    scene.fog = new Fog(scene.background.getHex(), 1, 5000)

    const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6)
    hemiLight.color.setHSL(0.6, 1, 0.6)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75)
    hemiLight.position.set(0, 50, 0)
    scene.add(hemiLight)

    const dirLight = new DirectionalLight(0xffffff, 1)
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(0, -3, 1)
    dirLight.position.multiplyScalar(1000)
    scene.add(dirLight)

    dirLight.castShadow = true

    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096

    const d = 200

    dirLight.shadow.camera.left = -d
    dirLight.shadow.camera.right = d
    dirLight.shadow.camera.top = d
    dirLight.shadow.camera.bottom = -d

    dirLight.shadow.camera.far = 3500
    dirLight.shadow.bias = 0.0001

    const plane = new PlaneBufferGeometry(1000, 1000)
    plane.rotateX(-Math.PI * 0.5)
    const material = new MeshLambertMaterial({
      color: 0x777777,
    })
    const ground = new Mesh(plane, material)

    ground.castShadow = true
    ground.receiveShadow = true

    scene.add(ground)

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    document.body.appendChild(renderer.domElement)

    return { scene, renderer, canvas, camera }
  },
  { global: true },
)
