import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { animate } from 'animejs';

/* Seven stepped tiers + a capstone = eight stops, one per section of the page. */
const TIER_COUNT = 7;
const TH = 0.78;          // tier height
const PLINTH = 0.34;      // base platform height
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function stoneTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#8a8a8a';
  g.fillRect(0, 0, 256, 256);
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 138 + (Math.random() - 0.5) * 46;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = '#1c1c1c';
  g.lineWidth = 4;
  for (let r = 0; r < 4; r++) {
    const y = r * 64;
    g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
    for (let k = 0; k < 2; k++) {
      const x = (r % 2) * 64 + k * 128;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 1);
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createScene(canvas, opts) {
  const { mobile, reduced } = opts;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;

  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.setClearColor(0x0a0805, 1);

  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x140d04, 0.021);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 260);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  /* ---------- sky: dusk gradient with a low gold sun ---------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(0x020100) },
        mid: { value: new THREE.Color(0x0d0802) },
        hor: { value: new THREE.Color(0x35200a) },
      },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 hor;
        void main(){
          float h = clamp(vP.y, 0.0, 1.0);
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.32, h));
          c = mix(c, top, smoothstep(0.22, 0.85, h));
          float g = pow(max(dot(normalize(vP), normalize(vec3(0.0, 0.1, -1.0))), 0.0), 90.0);
          c += vec3(1.0, 0.55, 0.1) * g * 0.28;
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  scene.add(sky);

  /* ---------- dunes ---------- */
  const gGeo = new THREE.PlaneGeometry(220, 220, 180, 180);
  gGeo.rotateX(-Math.PI / 2);
  const gp = gGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    const d = Math.hypot(x, z);
    const k = Math.min(1, Math.max(0, (d - 9) / 26));
    const h = (Math.sin(x * 0.17) * Math.cos(z * 0.13) * 1.1 + Math.sin(x * 0.06 + z * 0.08) * 2.2) * k * k * (3 - 2 * k);
    gp.setY(i, h - 0.02);
  }
  gGeo.computeVertexNormals();
  const ground = new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ color: 0x31200a, roughness: 0.93, metalness: 0.05, envMapIntensity: 0.25 }));
  scene.add(ground);

  /* ---------- scenery pyramids ---------- */
  const scenery = new THREE.Group();
  const sceneryMat = new THREE.MeshStandardMaterial({ color: 0x7d5a12, metalness: 0.85, roughness: 0.5, envMapIntensity: 0.7 });
  [[-15, 1.7, -13, 2.5, 3.4, 0.35], [13, 1.3, -18, 2.0, 2.7, -0.2], [-4, 0.9, -34, 1.9, 2.2, 0.1], [24, 1.8, -26, 3.2, 3.6, 0.5]].forEach(([x, y, z, r, h, ry]) => {
    const geo = new THREE.ConeGeometry(r, h, 4, 1);
    geo.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(geo, sceneryMat);
    m.position.set(x, y, z); m.rotation.y = ry;
    scenery.add(m);
  });
  scene.add(scenery);

  /* ---------- the great pyramid ---------- */
  const world = new THREE.Group();   // follows the scroll pose
  const pyr = new THREE.Group();     // spins
  world.add(pyr);
  scene.add(world);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(6.2, 6.7, PLINTH, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a1308, metalness: 0.7, roughness: 0.45 })
  );
  plinth.position.y = PLINTH / 2;
  world.add(plinth);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,.85)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01;
  world.add(shadow);

  const stone = stoneTexture(renderer);
  const colorLit = new THREE.Color(0xd9a21b);
  const colorDark = new THREE.Color(0x241907);
  const tiers = [];

  function makeTier(geo, y, index) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorDark.clone(), metalness: 0.6, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35,
      bumpMap: stone, bumpScale: 1.4, roughnessMap: stone, emissive: new THREE.Color(0xffa800), emissiveIntensity: 0,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.index = index;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), new THREE.LineBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.15 }));
    mesh.add(edges);
    pyr.add(mesh);
    const t = { mesh, mat, edges, baseY: y, lit: 0, target: 0, hover: 0, hoverTarget: 0, drop: reduced ? 0 : 18, dspin: reduced ? 0 : 2.4 };
    tiers.push(t);
    return t;
  }

  let r = 3.7;
  for (let i = 0; i < TIER_COUNT; i++) {
    const top = r * 0.88;
    const geo = new THREE.CylinderGeometry(top, r, TH, 4, 1, false);
    geo.rotateY(Math.PI / 4);
    makeTier(geo, PLINTH + TH / 2 + i * TH, i);
    r = top * 0.9;
  }
  const capGeo = new THREE.ConeGeometry(r * 0.98, 1.45, 4, 1);
  capGeo.rotateY(Math.PI / 4);
  const capY = PLINTH + TIER_COUNT * TH + 0.72;
  const cap = makeTier(capGeo, capY, TIER_COUNT);

  /* beam of light from the capstone */
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.9, 22, 32, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uI: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec2 vUv; uniform float uI; void main(){ float a = pow(vUv.y, 1.6) * 0.5 * uI; gl_FragColor = vec4(1.0, 0.78, 0.25, a); }',
    })
  );
  beam.position.y = capY + 11;
  world.add(beam);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.018, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.85 }));
  halo.position.y = capY + 1.5; halo.rotation.x = Math.PI / 2.4;
  world.add(halo);

  const rings = [5.2, 6.9, 8.8].map((rad, i) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(rad, rad + 0.035, 160),
      new THREE.MeshBasicMaterial({ color: 0xffc431, transparent: true, opacity: 0.5 - i * 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2; m.position.y = 0.03;
    world.add(m);
    return m;
  });

  /* ---------- floating pyramid shards ---------- */
  const SHARDS = mobile ? 60 : 140;
  const shardGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
  shardGeo.rotateY(Math.PI / 4);
  const shards = new THREE.InstancedMesh(shardGeo, new THREE.MeshStandardMaterial({ color: 0xd9a21b, metalness: 1, roughness: 0.34, emissive: 0x3a2400, emissiveIntensity: 0.22 }), SHARDS);
  const shardData = Array.from({ length: SHARDS }, () => ({
    radius: 4.7 + Math.random() * 5.6, y: 0.7 + Math.random() * 8.6,
    speed: (0.07 + Math.random() * 0.2) * (Math.random() < 0.5 ? -1 : 1),
    phase: Math.random() * Math.PI * 2, spin: 0.8 + Math.random() * 2, s: 0.5 + Math.random() * 1.5,
  }));
  world.add(shards);
  const dummy = new THREE.Object3D();

  /* ---------- gold dust ---------- */
  const DUST = mobile ? 500 : 1300;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const a = Math.random() * Math.PI * 2, rr = 3 + Math.random() * 24;
    dPos[i * 3] = Math.cos(a) * rr; dPos[i * 3 + 1] = Math.random() * 16; dPos[i * 3 + 2] = Math.sin(a) * rr;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: 0.06, color: 0xffcf4a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* ---------- lights ---------- */
  const key = new THREE.DirectionalLight(0xffe2a0, 1.5); key.position.set(6, 12, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa21a, 1.0); rim.position.set(-8, 5, -6); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffd48a, 0x1a1205, 0.2));
  const capLight = new THREE.PointLight(0xffc83a, 0, 16, 2); capLight.position.set(0, capY + 1.2, 0); world.add(capLight);
  const baseGlow = new THREE.PointLight(0xff9d00, 5, 18, 2); baseGlow.position.set(0, 0.6, 0); world.add(baseGlow);

  /* ---------- post: bloom ---------- */
  let composer = null, bloom = null;
  const BLOOM_BASE = mobile ? 0 : 0.36;
  function buildComposer(w, h) {
    const rt = new THREE.WebGLRenderTarget(w * dpr, h * dpr, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(w, h), BLOOM_BASE, 0.42, 0.92);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* ---------- state ---------- */
  const fx = { burst: 0, intro: reduced ? 1 : 0 };
  const pose = { x: 3.6, y: 0, z: 0, ry: 0.5, cy: 3.6, cz: 15.5, s: 1 };
  const goal = { ...pose };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, over: false, cx: 0, cy: 0 };
  const ray = new THREE.Raycaster();
  const pickables = tiers.map((t) => t.mesh);
  let hoverIndex = -1;
  let spin = 0;
  let last = 0, slowFrames = 0, avgDt = 0.016;
  const handlers = { onHover: () => {}, onPick: () => {} };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = 36 + Math.max(0, 1 - camera.aspect) * 22;
    camera.updateProjectionMatrix();
    if (!composer && !mobile && BLOOM_BASE > 0 && !resize.noBloom) buildComposer(w, h);
    else if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); }
  }

  function setPose(p) { Object.assign(goal, p); if (reduced) Object.assign(pose, goal); }
  function setActive(a) {
    /* a: 0 = hero (everything lit), 1..8 = section; tiers below the current one stay lit */
    tiers.forEach((t, i) => {
      t.target = a === 0 ? 1 : i < a - 1 ? 1 : i === a - 1 ? 2 : 0.08;
    });
  }
  function setExternalHover(i) { tiers.forEach((t, k) => { t.hoverTarget = k === i ? 1 : 0; }); }

  function shockwave(strength = 1) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 96),
      new THREE.MeshBasicMaterial({ color: 0xffd84d, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2; m.position.y = 0.05;
    world.add(m);
    const st = { t: 0 };
    animate(st, {
      t: 1, duration: 1500, ease: 'outExpo',
      onUpdate: () => { m.scale.setScalar(1 + st.t * 18 * strength); m.material.opacity = (1 - st.t) * 0.9; },
      onComplete: () => { world.remove(m); m.geometry.dispose(); m.material.dispose(); },
    });
  }

  function burst(strength = 1) {
    if (reduced) return;
    animate(fx, { burst: [1 * strength, 0], duration: 1900, ease: 'outExpo' });
    shockwave(strength);
  }

  function intro() {
    if (reduced) { fx.intro = 1; tiers.forEach((t) => { t.drop = 0; t.dspin = 0; }); return; }
    tiers.forEach((t, i) => {
      animate(t, { drop: [18, 0], dspin: [2.4, 0], duration: 1700, delay: 350 + i * 140, ease: 'outExpo' });
    });
    animate(fx, { intro: [0, 1], duration: 2400, delay: 1100, ease: 'outCubic' });
    setTimeout(() => burst(0.9), 350 + 7 * 140 + 700);
  }

  /* pointer on the canvas (only reached where no page content sits on top) */
  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.over = true;
  });
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { pointer.over = false; });
  canvas.addEventListener('click', () => {
    if (hoverIndex >= 0) handlers.onPick(hoverIndex);
    else burst(0.7);
  });

  const m4 = new THREE.Matrix4();
  function update(ms) {
    const t = ms / 1000;
    let dt = Math.min(0.05, t - last || 0.016);
    last = t;
    if (reduced) dt = 0.016;

    /* adaptive quality */
    avgDt += (dt - avgDt) * 0.05;
    if (!reduced && avgDt > 0.034) slowFrames++; else slowFrames = Math.max(0, slowFrames - 2);
    if (slowFrames > 120) {
      slowFrames = 0;
      if (composer) { composer.dispose(); composer = null; bloom = null; resize.noBloom = true; }
      else if (dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
    }

    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.2);
    for (const key of Object.keys(goal)) pose[key] += (goal[key] - pose[key]) * k;
    pointer.sx += (pointer.x - pointer.sx) * (reduced ? 0 : 1 - Math.exp(-dt * 4));
    pointer.sy += (pointer.y - pointer.sy) * (reduced ? 0 : 1 - Math.exp(-dt * 4));

    world.position.set(pose.x, pose.y, pose.z);
    world.scale.setScalar(pose.s);
    spin += reduced ? 0 : dt * (0.16 + fx.burst * 1.4);
    pyr.rotation.y = pose.ry + spin;

    /* tiers */
    for (let i = 0; i < tiers.length; i++) {
      const tr = tiers[i];
      tr.lit += (tr.target - tr.lit) * (reduced ? 1 : Math.min(1, dt * 4));
      tr.hover += (tr.hoverTarget - tr.hover) * Math.min(1, dt * 8);
      const l = clamp01(tr.lit);
      tr.mat.color.copy(colorDark).lerp(colorLit, l);
      tr.mat.metalness = 0.55 + 0.45 * l;
      tr.mat.roughness = 0.56 - 0.3 * l;
      tr.mat.emissiveIntensity = Math.max(0, tr.lit - 1) * 0.42 + tr.hover * 0.4 + fx.burst * 0.22 * l;
      tr.edges.material.opacity = 0.12 + 0.42 * l + tr.hover * 0.3;
      tr.mesh.position.y = tr.baseY + tr.drop;
      tr.mesh.rotation.y = tr.dspin;
    }
    const capLit = clamp01(cap.lit);
    capLight.intensity = (2 + cap.lit * 8 + fx.burst * 14) * fx.intro;
    beam.material.uniforms.uI.value = (0.25 + cap.lit * 0.5 + fx.burst * 0.6) * fx.intro * (capLit > 0.5 ? 1 : 0.4);
    halo.rotation.z += reduced ? 0 : dt * 0.8;
    halo.material.opacity = 0.25 + 0.6 * capLit;
    rings.forEach((m, i) => { if (!reduced) m.rotation.z += dt * (0.05 + i * 0.03) * (i % 2 ? -1 : 1); });

    /* shards */
    const burstR = 1 + fx.burst * 0.55;
    for (let i = 0; i < SHARDS; i++) {
      const d = shardData[i];
      const a = d.phase + (reduced ? 0 : t * d.speed * (1 + fx.burst * 5));
      dummy.position.set(Math.cos(a) * d.radius * burstR, d.y + (reduced ? 0 : Math.sin(t * 0.7 + d.phase) * 0.28), Math.sin(a) * d.radius * burstR);
      dummy.rotation.set(reduced ? d.phase : t * d.spin, reduced ? d.phase * 0.7 : t * d.spin * 0.7, 0);
      dummy.scale.setScalar(d.s * fx.intro);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;

    /* dust */
    if (!reduced) {
      const p = dGeo.attributes.position.array;
      for (let i = 0; i < DUST; i++) {
        p[i * 3 + 1] += dt * (0.18 + (i % 7) * 0.03 + fx.burst * 1.6);
        if (p[i * 3 + 1] > 16) p[i * 3 + 1] = 0;
      }
      dGeo.attributes.position.needsUpdate = true;
      dust.rotation.y += dt * 0.02;
    }
    dust.material.opacity = 0.55 * fx.intro;

    /* camera */
    camera.position.set(pointer.sx * 1.0, pose.cy + pointer.sy * 0.5, pose.cz);
    camera.lookAt(0, 2.8, 0);
    sky.position.copy(camera.position);

    /* hover picking */
    if (pointer.over) {
      ray.setFromCamera({ x: (pointer.cx / window.innerWidth) * 2 - 1, y: -((pointer.cy / window.innerHeight) * 2 - 1) }, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      const idx = hit ? hit.object.userData.index : -1;
      if (idx !== hoverIndex) {
        hoverIndex = idx;
        setExternalHover(idx);
        handlers.onHover(idx, pointer.cx, pointer.cy);
      } else if (idx >= 0) handlers.onHover(idx, pointer.cx, pointer.cy);
    } else if (hoverIndex !== -1) {
      hoverIndex = -1; setExternalHover(-1); handlers.onHover(-1, 0, 0);
    }

    if (bloom) bloom.strength = BLOOM_BASE + fx.burst * 0.9;
    if (composer) composer.render(dt); else renderer.render(scene, camera);
  }

  resize();
  window.addEventListener('resize', resize);
  intro();
  setActive(0);

  return { update, setPose, setActive, setExternalHover, burst, handlers, resize };
}
