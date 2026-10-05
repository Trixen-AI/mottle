import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// A sphere of 48k-ish "notes": thousands of dots of standard sizes, a few pulsing pools,
// and one lichen dot (your transfer) that drifts in among them.
const N = 5200

export function Globe() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(0, 0, 4.2)

    const globe = new THREE.Group()
    globe.rotation.x = 0.32
    globe.rotation.z = -0.12
    scene.add(globe)

    // occluding core so far-side dots are hidden
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x0d0f0d }))
    globe.add(core)

    // rim glow (fresnel) on a back-face shell
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 64, 64),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { c: { value: new THREE.Color(0xf1f0eb) } },
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 c; varying vec3 vN; void main(){ float f = pow(1.0 - abs(vN.z), 3.0); gl_FragColor = vec4(c, f * 0.16); }',
      }),
    )
    scene.add(rim)

    // dots: fibonacci sphere, mottled brightness with a few dense "continents" of activity
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const golden = Math.PI * (3 - Math.sqrt(5))
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const hubs = [new THREE.Vector3(0.3, 0.6, 0.74), new THREE.Vector3(-0.7, 0.2, 0.68), new THREE.Vector3(0.5, -0.5, 0.7), new THREE.Vector3(-0.2, -0.3, -0.9)].map((v) => v.normalize())
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const th = golden * i
      const v = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
      pos.set([v.x, v.y, v.z], i * 3)
      const near = Math.max(...hubs.map((h) => h.dot(v)))
      const b = 0.08 + Math.pow(Math.max(0, near), 9) * 0.9 * (0.4 + rand() * 0.6) + rand() * 0.08
      col.set([b * 0.95, b * 0.94, b * 0.92], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const dots = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.022, vertexColors: true, sizeAttenuation: true, transparent: true, depthWrite: false }))
    dots.scale.setScalar(1.002)
    globe.add(dots)

    // pool markers: a bright dot plus an expanding ring
    const ringGeo = new THREE.RingGeometry(0.035, 0.042, 48)
    const markers = hubs.slice(0, 3).map((h, i) => {
      const g = new THREE.Group()
      g.position.copy(h.clone().multiplyScalar(1.01))
      g.lookAt(h.clone().multiplyScalar(2))
      const color = i === 1 ? 0xc9f26a : 0xf1f0eb
      const center = new THREE.Mesh(new THREE.CircleGeometry(0.014, 24), new THREE.MeshBasicMaterial({ color }))
      const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide }))
      g.add(center, ringMesh)
      globe.add(g)
      return { ringMesh, phase: i * 0.33 }
    })

    const resize = () => {
      const { width, height } = el.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(1, height)
      // keep the sphere (rim included) inside the box: ~84% of its height, or width on narrow boxes
      const fit = Math.min(1, camera.aspect)
      camera.position.z = 1 / Math.tan((camera.fov * Math.PI) / 360) / (0.84 * fit)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let raf = 0
    let visible = true
    const clock = new THREE.Clock()
    const tick = () => {
      const t = clock.getElapsedTime()
      globe.rotation.y = 0.6 + t * 0.06
      markers.forEach((m) => {
        const k = (t * 0.45 + m.phase) % 1
        m.ringMesh.scale.setScalar(1 + k * 3)
        ;(m.ringMesh.material as THREE.MeshBasicMaterial).opacity = 1 - k
      })
      renderer.render(scene, camera)
      if (!reduced && visible) raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      renderer.dispose()
      geo.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={host} className="globe-box" />
}
