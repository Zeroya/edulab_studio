import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EARTH_TEXTURES } from '../data/earthTextures';
import { ELEMENT_SPECS } from '../data/elementSpecs';
import { CHEMISTRY_MODELS } from '../data/chemistryModels';
import { useStudio } from '../context/StudioContext';

// ============================================================================
// 3. ЦЕНТРАЛЬНЕ 3D / WEBXR ВІКНО (Viewport3D)
// ============================================================================
export default function Viewport3D() {
  const {
    theme,
    themeId,
    activeModelId,
    verilogState,
    leftState,
    rightState,
    setSceneItems,
    handleSelectEntity,
    setXrMessage,
    apiRef,
    liveFlagsRef,
  } = useStudio();

  const mountRef = useRef(null);
  const resizeHandlerRef = useRef(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.sceneBg);

    const isVerilogModel = activeModelId.startsWith('v-');
    const defaultCamPos = isVerilogModel ? [0, 1.55, 6.2] : [0, 1.85, 5.2];

    const camera = new THREE.PerspectiveCamera(
      46,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );
    camera.position.set(...defaultCamPos);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.xr.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.15, 0);

    const hemiLight = new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, 1.15);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(theme.dirColor, 2.0);
    dirLight.position.set(4, 7, 5);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(12, 24, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 1.15, 0);
    scene.add(rootGroup);

    const measureGroup = new THREE.Group();
    scene.add(measureGroup);

    const texLoader = new THREE.TextureLoader();
    texLoader.setCrossOrigin('anonymous');

    const objectMap = new Map();

    const clearModelGroup = () => {
      while (rootGroup.children.length > 0) {
        rootGroup.remove(rootGroup.children[0]);
      }
      objectMap.clear();
    };

    const registerEntity = (mesh, id, name, colorHex, layerGroup = 'outer', explodeDir = [0, 0, 0]) => {
      mesh.userData = {
        entityId: id,
        name,
        colorHex,
        layerGroup,
        basePos: mesh.position.clone(),
        explodeVec: new THREE.Vector3(...explodeDir),
      };
      objectMap.set(id, mesh);
      rootGroup.add(mesh);
    };

    const makeWire = (p1, p2, isHigh, radius = 0.032) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = Math.max(0.01, dir.length());
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, len, 14),
        new THREE.MeshStandardMaterial({
          color: isHigh ? 0x22c55e : 0x475569,
          emissive: isHigh ? 0x16a34a : 0x000000,
          emissiveIntensity: isHigh ? 0.85 : 0,
          metalness: 0.4,
          roughness: 0.3,
        })
      );
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      return mesh;
    };

    const makeGateBody = (type, pos, scale = 1) => {
      const grp = new THREE.Group();
      grp.position.set(...pos);
      grp.scale.setScalar(scale);

      const colorMap = {
        AND: 0x0284c7,
        OR: 0x7c3aed,
        XOR: 0xd97706,
        NAND: 0xe11d48,
      };
      const mainColor = colorMap[type] || 0x7c3aed;
      const mat = new THREE.MeshStandardMaterial({
        color: mainColor,
        emissive: mainColor,
        emissiveIntensity: 0.3,
        metalness: 0.45,
        roughness: 0.25,
      });

      if (type === 'AND' || type === 'NAND') {
        const backBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.72, 0.28), mat);
        backBox.position.x = -0.15;
        const frontCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24, 1, false, 0, Math.PI),
          mat
        );
        frontCyl.rotation.x = Math.PI / 2;
        frontCyl.position.x = 0.06;
        grp.add(backBox, frontCyl);

        if (type === 'NAND') {
          const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), mat);
          bubble.position.x = 0.48;
          grp.add(bubble);
        }
      } else {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.44, 0.82, 24), mat);
        body.rotation.z = -Math.PI / 2;
        grp.add(body);

        if (type === 'XOR') {
          const arc = new THREE.Mesh(
            new THREE.TorusGeometry(0.42, 0.03, 12, 24, Math.PI * 0.8),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.6 })
          );
          arc.position.x = -0.45;
          arc.rotation.z = Math.PI * 0.6;
          grp.add(arc);
        }
      }

      return grp;
    };

    const buildModelById = (modelId) => {
      clearModelGroup();
      const itemsList = [];

      if (modelId === 'geo-earth-layers') {
        const dayTex = texLoader.load(EARTH_TEXTURES.dayMap);
        const bumpTex = texLoader.load(EARTH_TEXTURES.bumpMap);

        const innerCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 32, 32),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.7 })
        );
        registerEntity(innerCore, 'geo-inner-core', 'Внутрішнє ядро (~5500 °C)', '#fef08a', 'core', [-0.45, -0.25, 0.45]);
        itemsList.push({ id: 'geo-inner-core', name: 'Внутрішнє ядро', color: '#fef08a' });

        const outerCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.56, 32, 32, 0, Math.PI * 1.5),
          new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.35, side: THREE.DoubleSide })
        );
        registerEntity(outerCore, 'geo-outer-core', 'Зовнішнє рідке ядро', '#f97316', 'core', [-0.25, -0.1, 0.25]);
        itemsList.push({ id: 'geo-outer-core', name: 'Зовнішнє ядро', color: '#f97316' });

        const mantle = new THREE.Mesh(
          new THREE.SphereGeometry(0.88, 40, 40, 0, Math.PI * 1.5),
          new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6, side: THREE.DoubleSide })
        );
        registerEntity(mantle, 'geo-mantle', 'Мантія Землі (2900 км)', '#b91c1c', 'middle', [0.1, 0.05, -0.1]);
        itemsList.push({ id: 'geo-mantle', name: 'Мантія Землі', color: '#b91c1c' });

        const crust = new THREE.Mesh(
          new THREE.SphereGeometry(1.02, 48, 48, 0, Math.PI * 1.5),
          new THREE.MeshStandardMaterial({ map: dayTex, bumpMap: bumpTex, bumpScale: 0.03, side: THREE.DoubleSide })
        );
        registerEntity(crust, 'geo-crust', 'Земна кора (Супутникова карта)', '#38bdf8', 'outer', [0.35, 0.2, -0.35]);
        itemsList.push({ id: 'geo-crust', name: 'Земна кора', color: '#38bdf8' });
      } else if (modelId === 'geo-globe-clouds') {
        const dayTex = texLoader.load(EARTH_TEXTURES.dayMap);
        const bumpTex = texLoader.load(EARTH_TEXTURES.bumpMap);
        const specTex = texLoader.load(EARTH_TEXTURES.specularMap);
        const cloudsTex = texLoader.load(EARTH_TEXTURES.cloudsMap);
        const moonTex = texLoader.load(EARTH_TEXTURES.moonMap);

        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(0.95, 48, 48),
          new THREE.MeshPhongMaterial({ map: dayTex, bumpMap: bumpTex, bumpScale: 0.04, specularMap: specTex })
        );
        registerEntity(earth, 'geo-earth-surface', 'Поверхня Землі та Світовий океан', '#0284c7', 'middle', [0, 0, 0]);
        itemsList.push({ id: 'geo-earth-surface', name: 'Планета Земля', color: '#0284c7' });

        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(0.99, 48, 48),
          new THREE.MeshLambertMaterial({ map: cloudsTex, transparent: true, opacity: 0.85 })
        );
        registerEntity(clouds, 'geo-clouds', 'Хмарний шар тропосфери', '#f8fafc', 'outer', [0, 0.35, 0]);
        itemsList.push({ id: 'geo-clouds', name: 'Хмари атмосфери', color: '#f8fafc' });

        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 32, 32),
          new THREE.MeshStandardMaterial({ map: moonTex, roughness: 0.9 })
        );
        moon.position.set(1.65, 0.35, 0);
        registerEntity(moon, 'geo-moon', 'Місяць (Природний супутник)', '#94a3b8', 'core', [0.4, 0.2, 0]);
        itemsList.push({ id: 'geo-moon', name: 'Місяць', color: '#94a3b8' });
      } else if (modelId === 'geo-volcano') {
        // Реалістичний 3D-розріз стратовулкана з шаруватими породами, текстурою лави та димовим шлейфом
        const rockTex = texLoader.load(EARTH_TEXTURES.rockMap);
        rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
        rockTex.repeat.set(3, 2);

        const lavaTex = texLoader.load(EARTH_TEXTURES.lavaMap);
        lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping;
        lavaTex.repeat.set(2, 2);

        const bumpTex = texLoader.load(EARTH_TEXTURES.bumpMap);

        // 1. Геологічна платформа основи (розрізаний блок земної кори під вулканом)
        const baseCrust = new THREE.Mesh(
          new THREE.CylinderGeometry(1.42, 1.48, 0.34, 64, 1, false, 0, Math.PI * 1.45),
          new THREE.MeshStandardMaterial({
            map: rockTex,
            color: 0x57534e,
            roughness: 0.9,
            side: THREE.DoubleSide,
          })
        );
        baseCrust.position.set(0, -0.78, 0);
        registerEntity(baseCrust, 'volc-base', 'Фундамент земної кори під вулканом', '#57534e', 'middle', [0, -0.25, 0]);

        // 2. Деталізований стратовулкан у розрізі (255° сектор із ерозійними ярами та шарами тефри)
        const coneGeo = new THREE.CylinderGeometry(0.22, 1.38, 1.32, 96, 36, false, 0, Math.PI * 1.45);
        const posAttr = coneGeo.attributes.position;
        const vColors = [];
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const vz = posAttr.getZ(i);
          const r = Math.hypot(vx, vz);
          const normH = (vy + 0.66) / 1.32; // 0 біля підніжжя, 1 біля кратера

          if (r > 0.05) {
            // Природний увігнутий профіль стратовулкана + радіальні лавові хребти (барранкоси)
            const concaveScale = 1 - 0.18 * Math.sin(normH * Math.PI);
            const ridges =
              (Math.sin(Math.atan2(vz, vx) * 16) * 0.05 + Math.cos(Math.atan2(vz, vx) * 9) * 0.03) *
              (1 - normH * 0.7);
            const strata = Math.sin(vy * 24) * 0.014;
            const newR = r * concaveScale + ridges + strata;
            posAttr.setX(i, (vx / r) * newR);
            posAttr.setZ(i, (vz / r) * newR);
          }

          // Вершинне забарвлення: зелень біля підніжжя -> базальт -> попіл біля вершини
          if (normH < 0.22) vColors.push(0.25, 0.36, 0.22);
          else if (normH < 0.78) vColors.push(0.38, 0.34, 0.32);
          else vColors.push(0.22, 0.2, 0.2);
        }
        coneGeo.setAttribute('color', new THREE.Float32BufferAttribute(vColors, 3));
        coneGeo.computeVertexNormals();

        const cone = new THREE.Mesh(
          coneGeo,
          new THREE.MeshStandardMaterial({
            map: rockTex,
            bumpMap: bumpTex,
            bumpScale: 0.06,
            vertexColors: true,
            roughness: 0.88,
            side: THREE.DoubleSide,
          })
        );
        cone.position.set(0, 0.04, 0);
        registerEntity(cone, 'volc-cone', 'Вулканічний конус (шари лави та попелу)', '#78716c', 'outer', [0.22, 0, -0.22]);
        itemsList.push({ id: 'volc-cone', name: 'Вулканічний конус', color: '#78716c' });

        // 3. Кілька реалістичних потоків розпеченої лави з текстурою лави
        const lavaCurves = [
          [
            new THREE.Vector3(0.06, 0.68, 0.16),
            new THREE.Vector3(0.28, 0.32, 0.44),
            new THREE.Vector3(0.58, -0.15, 0.76),
            new THREE.Vector3(0.95, -0.58, 1.02),
          ],
          [
            new THREE.Vector3(-0.14, 0.67, 0.12),
            new THREE.Vector3(-0.42, 0.22, 0.38),
            new THREE.Vector3(-0.78, -0.35, 0.68),
          ],
        ];
        lavaCurves.forEach((pts, idx) => {
          const flowMesh = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, idx === 0 ? 0.052 : 0.036, 12, false),
            new THREE.MeshStandardMaterial({
              map: lavaTex,
              color: 0xff7b00,
              emissive: 0xff4500,
              emissiveMap: lavaTex,
              emissiveIntensity: 1.25,
              roughness: 0.4,
            })
          );
          registerEntity(flowMesh, `volc-lava-flow-${idx}`, 'Потік розпеченої лави на схилі', '#fb923c', 'outer', [0.22, 0, -0.22]);
        });

        // 4. Глибинне магматичне вогнище з текстурою киплячої магми
        const chamber = new THREE.Mesh(
          new THREE.SphereGeometry(0.44, 40, 40),
          new THREE.MeshStandardMaterial({
            map: lavaTex,
            color: 0xff3b00,
            emissive: 0xdc2626,
            emissiveMap: lavaTex,
            emissiveIntensity: 1.35,
          })
        );
        chamber.scale.set(1.35, 0.72, 1.15);
        chamber.position.set(0, -0.64, 0);
        registerEntity(chamber, 'volc-chamber', 'Магматичне вогнище (1100–1300 °C)', '#ef4444', 'core', [0, -0.3, 0]);
        itemsList.push({ id: 'volc-chamber', name: 'Магматичне вогнище', color: '#ef4444' });

        // 5. Головне жерло та бічна дайка (вторинний канал)
        const conduit = new THREE.Mesh(
          new THREE.CylinderGeometry(0.11, 0.18, 1.32, 28),
          new THREE.MeshStandardMaterial({
            map: lavaTex,
            color: 0xf97316,
            emissive: 0xea580c,
            emissiveIntensity: 1.1,
          })
        );
        conduit.position.set(0, 0.02, 0);
        registerEntity(conduit, 'volc-conduit', 'Головне жерло вулкана', '#f97316', 'middle', [0, 0.1, 0]);
        itemsList.push({ id: 'volc-conduit', name: 'Жерло вулкана', color: '#f97316' });

        // 6. Кратер із розпеченим лавовим озером та хмарою вулканічного попелу
        const crater = new THREE.Mesh(
          new THREE.CylinderGeometry(0.21, 0.13, 0.12, 32),
          new THREE.MeshStandardMaterial({
            map: lavaTex,
            color: 0xfacc15,
            emissive: 0xf97316,
            emissiveIntensity: 1.2,
          })
        );
        crater.position.set(0, 0.67, 0);
        registerEntity(crater, 'volc-crater', 'Кратер та лавове озеро на вершині', '#facc15', 'outer', [0, 0.35, 0]);
        itemsList.push({ id: 'volc-crater', name: 'Кратер вулкана', color: '#facc15' });

        const ashCloud = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.26, 2),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55, roughness: 1 })
        );
        ashCloud.scale.set(1.4, 0.85, 1.1);
        ashCloud.position.set(0.08, 0.98, 0.05);
        registerEntity(ashCloud, 'volc-ash', 'Хмара вулканічного попелу та газів', '#94a3b8', 'outer', [0, 0.5, 0]);
      } else if (modelId === 'geo-relief-zones') {
        // Єдиний безшовний 3D-діорамний розріз земної поверхні: Гори -> Рівнина з річкою -> Шельф -> Океанічний жолоб
        const rockTex = texLoader.load(EARTH_TEXTURES.rockMap);
        rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
        rockTex.repeat.set(4, 2);

        const bumpTex = texLoader.load(EARTH_TEXTURES.bumpMap);
        const waterTex = texLoader.load(EARTH_TEXTURES.waterNormals);
        waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
        waterTex.repeat.set(3, 3);

        // Функція обчислення висоти рельєфу в кожній точці (x від -1.65 до +1.65, z від -0.75 до +0.75)
        const getTerrainHeight = (x, z) => {
          // 1. Високі складчасті гори зліва (x < -0.55)
          const peak1 = Math.exp(-((x + 1.25) ** 2 * 5.5 + (z + 0.15) ** 2 * 3.5)) * 1.18;
          const peak2 = Math.exp(-((x + 0.88) ** 2 * 6.5 + (z - 0.25) ** 2 * 4.0)) * 0.92;
          const peak3 = Math.exp(-((x + 1.42) ** 2 * 7.0 + (z - 0.35) ** 2 * 4.5)) * 0.84;
          const ridgeNoise =
            (Math.sin(x * 16 + z * 11) * 0.05 + Math.cos(x * 27 - z * 19) * 0.03) *
            Math.max(0, 1 - (x + 1.65) / 1.3);

          // 2. Рівнина з меандруючою річковою долиною в центрі (-0.55 <= x <= 0.45)
          const riverCenterZ = Math.sin(x * 5.5) * 0.24;
          const riverCarve = Math.exp(-((z - riverCenterZ) ** 2) * 38) * -0.11 * Math.max(0, 1 - Math.abs(x + 0.05) / 0.75);
          const plainUndulation = Math.sin(x * 5) * Math.cos(z * 6) * 0.03;

          // 3. Берегова лінія (x ≈ 0.45), материковий шельф (0.45..1.05) та глибоководний схил/жолоб (x > 1.05)
          let baseElevation = -0.14;
          if (x > 0.35 && x <= 1.05) {
            // Плавний материковий шельф під водою
            baseElevation = -0.16 - ((x - 0.35) / 0.7) * 0.18;
          } else if (x > 1.05) {
            // Крутий материковий схил у глибоководний жолоб
            baseElevation = -0.34 - ((x - 1.05) / 0.6) * 0.48;
          }

          return baseElevation + peak1 + peak2 + peak3 + ridgeNoise + riverCarve + plainUndulation;
        };

        // Верхня 3D-поверхня рельєфу високої щільності (120 x 56 полігонів)
        const terrainGeo = new THREE.PlaneGeometry(3.3, 1.5, 120, 56);
        terrainGeo.rotateX(-Math.PI / 2);
        const tPos = terrainGeo.attributes.position;
        const tColors = [];

        for (let i = 0; i < tPos.count; i++) {
          const px = tPos.getX(i);
          const pz = tPos.getZ(i);
          const py = getTerrainHeight(px, pz);
          tPos.setY(i, py);

          // Природне гіпсометричне розфарбування висот
          if (py > 0.56) {
            tColors.push(0.97, 0.98, 1.0); // Льодовики та снігові вершини
          } else if (py > 0.22) {
            tColors.push(0.45, 0.44, 0.46); // Скелясті схили гір
          } else if (py > -0.04) {
            tColors.push(0.24, 0.52, 0.25); // Передгір'я та лісисті височини
          } else if (py > -0.165) {
            tColors.push(0.32, 0.64, 0.30); // Зелена рівнина
          } else if (py > -0.22) {
            tColors.push(0.86, 0.78, 0.54); // Піщане узбережжя та мілководдя шельфу
          } else if (py > -0.42) {
            tColors.push(0.68, 0.58, 0.38); // Материковий шельф
          } else {
            tColors.push(0.18, 0.24, 0.34); // Глибоководний схил і океанічне дно
          }
        }
        terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(tColors, 3));
        terrainGeo.computeVertexNormals();

        const terrainMesh = new THREE.Mesh(
          terrainGeo,
          new THREE.MeshStandardMaterial({
            vertexColors: true,
            bumpMap: bumpTex,
            bumpScale: 0.025,
            roughness: 0.82,
          })
        );
        registerEntity(terrainMesh, 'rel-mountains', 'Гіпсометричний 3D-рельєф (Гори, Рівнина, Шельф)', '#22c55e', 'outer', [0, 0.15, 0]);
        itemsList.push({ id: 'rel-mountains', name: 'Гірський хребет та льодовики', color: '#cbd5e1' });

        // Геологічний зріз літосферної плити під діорамою (передня та бокові стінки блоку)
        const baseY = -0.92;
        const slabShape = new THREE.Shape();
        slabShape.moveTo(-1.65, baseY);
        for (let s = 0; s <= 80; s++) {
          const sx = -1.65 + (s / 80) * 3.3;
          slabShape.lineTo(sx, getTerrainHeight(sx, 0.75));
        }
        slabShape.lineTo(1.65, baseY);
        slabShape.closePath();

        const lithoBlock = new THREE.Mesh(
          new THREE.ExtrudeGeometry(slabShape, { depth: 1.48, bevelEnabled: false }),
          new THREE.MeshStandardMaterial({
            map: rockTex,
            color: 0x57534e,
            roughness: 0.92,
          })
        );
        lithoBlock.position.set(0, 0, -0.74);
        registerEntity(lithoBlock, 'rel-plain', 'Літосферна основа (континентальна та океанічна кора)', '#78716c', 'middle', [0, -0.15, 0]);
        itemsList.push({ id: 'rel-plain', name: 'Рівнина і літосферна основа', color: '#22c55e' });

        // Реалістичний об'єм води Світового океану та річки поверх шельфу
        const oceanWater = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, 0.64, 1.49),
          new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            normalMap: waterTex,
            normalScale: new THREE.Vector2(0.35, 0.35),
            transparent: true,
            opacity: 0.68,
            roughness: 0.15,
            metalness: 0.1,
          })
        );
        oceanWater.position.set(0.97, -0.49, 0);
        registerEntity(oceanWater, 'rel-shelf', 'Материковий шельф та води Світового океану', '#38bdf8', 'core', [0.2, 0.1, 0]);
        itemsList.push({ id: 'rel-shelf', name: 'Материковий шельф та океан', color: '#38bdf8' });
      } else if (modelId === 'geo-climate-belts') {
        // Покращений 3D-глобус кліматичних поясів із напівпрозорими тепловими зонами, орбітальними кільцями та сонячним потоком
        const dayTex = texLoader.load(EARTH_TEXTURES.dayMap);
        const bumpTex = texLoader.load(EARTH_TEXTURES.bumpMap);
        const specTex = texLoader.load(EARTH_TEXTURES.specularMap);
        const cloudsTex = texLoader.load(EARTH_TEXTURES.cloudsMap);

        const tiltRad = (23.44 * Math.PI) / 180;

        // 1. Основна планета із супутниковими текстурами
        const globe = new THREE.Mesh(
          new THREE.SphereGeometry(0.92, 64, 64),
          new THREE.MeshPhongMaterial({
            map: dayTex,
            bumpMap: bumpTex,
            bumpScale: 0.04,
            specularMap: specTex,
            shininess: 18,
          })
        );
        globe.rotation.z = tiltRad;
        registerEntity(globe, 'belt-globe', 'Земна куля (Нахил осі 23.44°)', '#38bdf8', 'middle', [0, 0, 0]);
        itemsList.push({ id: 'belt-globe', name: 'Земна куля (23.44°)', color: '#38bdf8' });

        // 2. Напівпрозорі 3D-зони теплових поясів навколо Землі (Екваторіальний, Тропічні, Помірні, Полярні)
        const beltGroup = new THREE.Group();
        beltGroup.rotation.z = tiltRad;

        const addThermalBand = (thetaStart, thetaLength, colorHex, opacity = 0.24) => {
          const band = new THREE.Mesh(
            new THREE.SphereGeometry(0.955, 64, 24, 0, Math.PI * 2, thetaStart, thetaLength),
            new THREE.MeshBasicMaterial({
              color: colorHex,
              transparent: true,
              opacity,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          );
          beltGroup.add(band);
        };

        // Північний полярний пояс (0°..23.5° від полюса)
        addThermalBand(0, (23.5 * Math.PI) / 180, 0x38bdf8, 0.3);
        // Північний помірний пояс (23.5°..66.5°)
        addThermalBand((23.5 * Math.PI) / 180, (43 * Math.PI) / 180, 0x22c55e, 0.22);
        // Жаркий (Тропічний + Екваторіальний) пояс (66.5°..113.5°)
        addThermalBand((66.5 * Math.PI) / 180, (47 * Math.PI) / 180, 0xf97316, 0.26);
        // Південний помірний пояс (113.5°..156.5°)
        addThermalBand((113.5 * Math.PI) / 180, (43 * Math.PI) / 180, 0x22c55e, 0.22);
        // Південний полярний пояс (156.5°..180°)
        addThermalBand((156.5 * Math.PI) / 180, (23.5 * Math.PI) / 180, 0x38bdf8, 0.3);

        // Тонкий шар хмар для глибини атмосфери
        const lightClouds = new THREE.Mesh(
          new THREE.SphereGeometry(0.935, 48, 48),
          new THREE.MeshLambertMaterial({ map: cloudsTex, transparent: true, opacity: 0.32, depthWrite: false })
        );
        beltGroup.add(lightClouds);

        registerEntity(beltGroup, 'belt-zones', 'Теплові та кліматичні пояси Землі', '#fb923c', 'outer', [0, 0, 0]);
        itemsList.push({ id: 'belt-zones', name: 'Теплові пояси (Жаркий / Помірні / Холодні)', color: '#fb923c' });

        // 3. Вісь обертання Землі з полярними наконечниками
        const axisRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 2.48, 16),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x38bdf8, emissiveIntensity: 0.35 })
        );
        axisRod.rotation.z = tiltRad;
        registerEntity(axisRod, 'belt-axis', 'Вісь обертання Землі (нахил 23.44°)', '#e2e8f0', 'outer', [0, 0, 0]);
        itemsList.push({ id: 'belt-axis', name: 'Вісь Землі (23.44°)', color: '#e2e8f0' });

        // 4. Яскравий Екватор (0°) та обидва Тропіки (23.5°) + Полярні кола (66.5°)
        const makeLatitudeRing = (latDeg, colorHex, tubeR = 0.016) => {
          const latRad = (latDeg * Math.PI) / 180;
          const rRing = Math.cos(latRad) * 0.965;
          const yOffset = Math.sin(latRad) * 0.965;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(rRing, tubeR, 16, 72),
            new THREE.MeshBasicMaterial({ color: colorHex })
          );
          ring.rotation.x = Math.PI / 2;
          ring.rotation.y = -tiltRad;
          ring.position.set(-Math.sin(tiltRad) * yOffset, Math.cos(tiltRad) * yOffset, 0);
          return ring;
        };

        const equator = makeLatitudeRing(0, 0xef4444, 0.024);
        registerEntity(equator, 'belt-equator', 'Екватор (0° широти — Екваторіальний пояс)', '#ef4444', 'outer', [0, 0.08, 0]);
        itemsList.push({ id: 'belt-equator', name: 'Екватор (0°)', color: '#ef4444' });

        const tropicN = makeLatitudeRing(23.5, 0xfacc15, 0.015);
        registerEntity(tropicN, 'belt-tropic-n', 'Північний тропік (23.5° пн. ш.)', '#facc15', 'core', [0, 0.16, 0]);
        itemsList.push({ id: 'belt-tropic-n', name: 'Північний тропік', color: '#facc15' });

        const tropicS = makeLatitudeRing(-23.5, 0xfacc15, 0.015);
        registerEntity(tropicS, 'belt-tropic-s', 'Південний тропік (23.5° пд. ш.)', '#facc15', 'core', [0, -0.16, 0]);
        itemsList.push({ id: 'belt-tropic-s', name: 'Південний тропік', color: '#facc15' });

        const arcticN = makeLatitudeRing(66.5, 0x7dd3fc, 0.013);
        const arcticS = makeLatitudeRing(-66.5, 0x7dd3fc, 0.013);
        registerEntity(arcticN, 'belt-arctic-n', 'Північне полярне коло (66.5° пн. ш.)', '#7dd3fc', 'core', [0, 0.24, 0]);
        registerEntity(arcticS, 'belt-arctic-s', 'Південне полярне коло (66.5° пд. ш.)', '#7dd3fc', 'core', [0, -0.24, 0]);
      }

      const chemModel = CHEMISTRY_MODELS.find((m) => m.id === modelId);
      if (chemModel) {
        const posMap = {};
        chemModel.atoms.forEach((atom, idx) => {
          const spec = ELEMENT_SPECS[atom.el] || ELEMENT_SPECS.C;
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(spec.radius, 32, 32),
            new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.25, metalness: 0.2 })
          );
          mesh.position.set(...atom.pos);
          posMap[atom.id] = new THREE.Vector3(...atom.pos);
          registerEntity(
            mesh,
            atom.id,
            atom.label,
            spec.color,
            idx === 0 ? 'core' : 'outer',
            atom.pos.map((v) => v * 0.45)
          );
          itemsList.push({ id: atom.id, name: atom.label, color: spec.color });
        });

        chemModel.bonds.forEach((bond, bIdx) => {
          const p1 = posMap[bond.from];
          const p2 = posMap[bond.to];
          if (!p1 || !p2) return;
          const dir = new THREE.Vector3().subVectors(p2, p1);
          const len = dir.length();
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

          const cyl = new THREE.Mesh(
            new THREE.CylinderGeometry(bond.order === 2 ? 0.055 : 0.035, bond.order === 2 ? 0.055 : 0.035, len, 16),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 })
          );
          cyl.position.copy(mid);
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          registerEntity(cyl, `bond-${bIdx}`, bond.label, '#94a3b8', 'middle', [0, 0, 0]);
        });
      }

      if (modelId.startsWith('v-')) {
        const st = liveFlagsRef.current.verilogState;
        const aOn = st.inA === 1;
        const bOn = st.inB === 1;
        const cOn = st.inC === 1;

        const makePin = (pos, isHigh, radius = 0.09) => {
          const pin = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 24),
            new THREE.MeshStandardMaterial({
              color: isHigh ? 0x22c55e : 0x334155,
              emissive: isHigh ? 0x16a34a : 0x000000,
              emissiveIntensity: isHigh ? 0.9 : 0,
              metalness: 0.4,
              roughness: 0.25,
            })
          );
          pin.position.set(...pos);
          return pin;
        };

        if (modelId === 'v-gates') {
          const outOn =
            st.gateMode === 'AND'
              ? aOn && bOn
              : st.gateMode === 'OR'
              ? aOn || bOn
              : st.gateMode === 'XOR'
              ? aOn !== bOn
              : !(aOn && bOn);

          const pinA = makePin([-1.55, 0.32, 0], aOn);
          registerEntity(pinA, 'v-pin-a', `Вхідний контакт A = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.25, 0.2, 0]);
          itemsList.push({ id: 'v-pin-a', name: `Клема A (${st.inA})`, color: aOn ? '#22c55e' : '#64748b' });

          const pinB = makePin([-1.55, -0.32, 0], bOn);
          registerEntity(pinB, 'v-pin-b', `Вхідний контакт B = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.25, -0.2, 0]);
          itemsList.push({ id: 'v-pin-b', name: `Клема B (${st.inB})`, color: bOn ? '#22c55e' : '#64748b' });

          const wA = makeWire([-1.55, 0.32, 0], [-0.35, 0.32, 0], aOn);
          registerEntity(wA, 'v-wire-a', `Провідник A = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.15, 0.15, 0]);

          const wB = makeWire([-1.55, -0.32, 0], [-0.35, -0.32, 0], bOn);
          registerEntity(wB, 'v-wire-b', `Провідник B = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.15, -0.15, 0]);

          const gateObj = makeGateBody(st.gateMode, [0.05, 0, 0], 1.15);
          registerEntity(gateObj, 'v-gate-core', `Логічний вентиль ${st.gateMode}`, '#38bdf8', 'middle', [0, 0, 0]);
          itemsList.push({ id: 'v-gate-core', name: `Вентиль ${st.gateMode}`, color: '#38bdf8' });

          const wOut = makeWire([0.52, 0, 0], [1.35, 0, 0], outOn);
          registerEntity(wOut, 'v-wire-y', `Вихідна лінія Y = ${outOn ? 1 : 0}`, outOn ? '#22c55e' : '#64748b', 'middle', [0.15, 0, 0]);

          const led = makePin([1.48, 0, 0], outOn, 0.22);
          registerEntity(led, 'v-led-y', `Світлодіод виходу Y = ${outOn ? 1 : 0}`, outOn ? '#10b981' : '#475569', 'core', [0.3, 0, 0]);
          itemsList.push({ id: 'v-led-y', name: `Вихід Y = ${outOn ? 1 : 0}`, color: outOn ? '#10b981' : '#475569' });
        } else if (modelId === 'v-cascade') {
          const midAnd = aOn && bOn;
          const finalOut = midAnd || cOn;

          const pinA = makePin([-1.72, 0.48, 0], aOn);
          const pinB = makePin([-1.72, 0.04, 0], bOn);
          const pinC = makePin([-1.72, -0.52, 0], cOn);
          registerEntity(pinA, 'vc-pa', `Вхід A = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.25, 0.2, 0]);
          registerEntity(pinB, 'vc-pb', `Вхід B = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.25, 0, 0]);
          registerEntity(pinC, 'vc-pc', `Резервний вхід C = ${st.inC}`, cOn ? '#22c55e' : '#64748b', 'outer', [-0.25, -0.25, 0]);
          itemsList.push({ id: 'vc-pa', name: `Клема A = ${st.inA}`, color: aOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vc-pb', name: `Клема B = ${st.inB}`, color: bOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vc-pc', name: `Клема C = ${st.inC}`, color: cOn ? '#22c55e' : '#64748b' });

          const wA = makeWire([-1.72, 0.48, 0], [-0.85, 0.48, 0], aOn);
          const wB = makeWire([-1.72, 0.04, 0], [-0.85, 0.04, 0], bOn);
          registerEntity(wA, 'vc-a', 'Шина A', aOn ? '#22c55e' : '#64748b', 'outer', [-0.15, 0.15, 0]);
          registerEntity(wB, 'vc-b', 'Шина B', bOn ? '#22c55e' : '#64748b', 'outer', [-0.15, 0, 0]);

          const g1 = makeGateBody('AND', [-0.55, 0.26, 0], 0.85);
          registerEntity(g1, 'vc-and', 'Каскад 1: Вентиль AND (A & B)', '#0284c7', 'middle', [0, 0.15, 0]);
          itemsList.push({ id: 'vc-and', name: 'Каскад 1: AND', color: '#0284c7' });

          const nodeMid = makePin([0.15, 0.21, 0], midAnd, 0.07);
          const wMid = makeWire([-0.15, 0.26, 0], [0.45, 0.16, 0], midAnd);
          const wC = makeWire([-1.72, -0.52, 0], [0.45, -0.22, 0], cOn);
          registerEntity(nodeMid, 'vc-nmid', `Проміжний вузол (A & B) = ${midAnd ? 1 : 0}`, midAnd ? '#22c55e' : '#64748b', 'middle', [0, 0.1, 0]);
          registerEntity(wMid, 'vc-mid', 'Проміжний провідник', midAnd ? '#22c55e' : '#64748b', 'middle', [0, 0, 0]);
          registerEntity(wC, 'vc-c', 'Обхідний канал C', cOn ? '#22c55e' : '#64748b', 'outer', [0, -0.2, 0]);
          itemsList.push({ id: 'vc-nmid', name: `Вузол (A & B) = ${midAnd ? 1 : 0}`, color: midAnd ? '#22c55e' : '#64748b' });

          const g2 = makeGateBody('OR', [0.75, -0.04, 0], 0.85);
          registerEntity(g2, 'vc-or', 'Каскад 2: Вентиль OR ((A & B) | C)', '#7c3aed', 'middle', [0.15, 0, 0]);
          itemsList.push({ id: 'vc-or', name: 'Каскад 2: OR', color: '#7c3aed' });

          const wOut = makeWire([1.15, -0.04, 0], [1.62, -0.04, 0], finalOut);
          registerEntity(wOut, 'vc-wy', 'Вихідна шина Y', finalOut ? '#22c55e' : '#64748b', 'middle', [0.2, 0, 0]);

          const led = makePin([1.74, -0.04, 0], finalOut, 0.21);
          registerEntity(led, 'vc-led', `Вихід Y = ${finalOut ? 1 : 0}`, finalOut ? '#10b981' : '#475569', 'core', [0.3, 0, 0]);
          itemsList.push({ id: 'vc-led', name: `Вихід Y = ${finalOut ? 1 : 0}`, color: finalOut ? '#10b981' : '#475569' });
        } else if (modelId === 'v-adder') {
          const sumOn = aOn !== bOn;
          const carryOn = aOn && bOn;

          const pinA = makePin([-1.62, 0.36, 0], aOn);
          const pinB = makePin([-1.62, -0.36, 0], bOn);
          const splitA = makePin([-1.1, 0.36, 0], aOn, 0.065);
          const splitB = makePin([-1.1, -0.36, 0], bOn, 0.065);
          registerEntity(pinA, 'va-pa', `Вхідний біт A = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.25, 0.2, 0]);
          registerEntity(pinB, 'va-pb', `Вхідний біт B = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.25, -0.2, 0]);
          registerEntity(splitA, 'va-sa', 'Вузол розгалуження A', aOn ? '#22c55e' : '#64748b', 'outer', [-0.1, 0.1, 0]);
          registerEntity(splitB, 'va-sb', 'Вузол розгалуження B', bOn ? '#22c55e' : '#64748b', 'outer', [-0.1, -0.1, 0]);
          itemsList.push({ id: 'va-pa', name: `Біт A = ${st.inA}`, color: aOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'va-pb', name: `Біт B = ${st.inB}`, color: bOn ? '#22c55e' : '#64748b' });

          const wA = makeWire([-1.62, 0.36, 0], [-0.4, 0.45, 0], aOn);
          const wB = makeWire([-1.62, -0.36, 0], [-0.4, -0.45, 0], bOn);
          const wA2 = makeWire([-1.1, 0.36, 0], [-0.4, -0.3, 0], aOn, 0.024);
          const wB2 = makeWire([-1.1, -0.36, 0], [-0.4, 0.3, 0], bOn, 0.024);
          registerEntity(wA, 'va-a', 'Шина A → XOR', aOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);
          registerEntity(wB, 'va-b', 'Шина B → AND', bOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);
          registerEntity(wA2, 'va-a2', 'Відгалуження A → AND', aOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);
          registerEntity(wB2, 'va-b2', 'Відгалуження B → XOR', bOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);

          const xorGate = makeGateBody('XOR', [0.05, 0.38, 0], 0.85);
          const andGate = makeGateBody('AND', [0.05, -0.38, 0], 0.85);
          registerEntity(xorGate, 'va-xor', 'Вентиль XOR (Сума Sum)', '#d97706', 'middle', [0, 0.2, 0]);
          registerEntity(andGate, 'va-and', 'Вентиль AND (Перенос Carry)', '#0284c7', 'middle', [0, -0.2, 0]);
          itemsList.push({ id: 'va-xor', name: 'XOR → Sum', color: '#d97706' });
          itemsList.push({ id: 'va-and', name: 'AND → Carry', color: '#0284c7' });

          const wSum = makeWire([0.45, 0.38, 0], [1.25, 0.38, 0], sumOn);
          const wCarry = makeWire([0.45, -0.38, 0], [1.25, -0.38, 0], carryOn);
          registerEntity(wSum, 'va-wsum', 'Лінія Sum', sumOn ? '#22c55e' : '#64748b', 'middle', [0.1, 0.1, 0]);
          registerEntity(wCarry, 'va-wcarry', 'Лінія Carry', carryOn ? '#f59e0b' : '#64748b', 'middle', [0.1, -0.1, 0]);

          const ledSum = makePin([1.38, 0.38, 0], sumOn, 0.19);
          registerEntity(ledSum, 'va-sum', `Вихід Суми Sum = ${sumOn ? 1 : 0}`, sumOn ? '#10b981' : '#475569', 'core', [0.25, 0.15, 0]);
          itemsList.push({ id: 'va-sum', name: `Sum = ${sumOn ? 1 : 0}`, color: sumOn ? '#10b981' : '#475569' });

          const ledCarry = new THREE.Mesh(
            new THREE.SphereGeometry(0.19, 28, 28),
            new THREE.MeshStandardMaterial({
              color: carryOn ? 0xf59e0b : 0x334155,
              emissive: carryOn ? 0xf59e0b : 0x000000,
              emissiveIntensity: carryOn ? 1.1 : 0,
            })
          );
          ledCarry.position.set(1.38, -0.38, 0);
          registerEntity(ledCarry, 'va-carry', `Вихід Переносу Carry = ${carryOn ? 1 : 0}`, carryOn ? '#f59e0b' : '#475569', 'core', [0.25, -0.15, 0]);
          itemsList.push({ id: 'va-carry', name: `Carry = ${carryOn ? 1 : 0}`, color: carryOn ? '#f59e0b' : '#475569' });
        } else if (modelId === 'v-mux') {
          const muxOut = cOn ? bOn : aOn;

          const pinA = makePin([-1.62, 0.4, 0], aOn);
          const pinB = makePin([-1.62, -0.4, 0], bOn);
          const pinC = makePin([0, -1.12, 0], cOn);
          registerEntity(pinA, 'vm-pa', `Канал D0 (A) = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.25, 0.2, 0]);
          registerEntity(pinB, 'vm-pb', `Канал D1 (B) = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.25, -0.2, 0]);
          registerEntity(pinC, 'vm-pc', `Селектор SEL (C) = ${st.inC}`, cOn ? '#f59e0b' : '#64748b', 'outer', [0, -0.3, 0]);
          itemsList.push({ id: 'vm-pa', name: `Канал A = ${st.inA}`, color: aOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vm-pb', name: `Канал B = ${st.inB}`, color: bOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vm-pc', name: `Селектор C = ${st.inC}`, color: cOn ? '#f59e0b' : '#64748b' });

          const wA = makeWire([-1.62, 0.4, 0], [-0.45, 0.4, 0], aOn);
          const wB = makeWire([-1.62, -0.4, 0], [-0.45, -0.4, 0], bOn);
          const wSel = makeWire([0, -1.12, 0], [0, -0.52, 0], cOn);
          registerEntity(wA, 'vm-a', 'Шина A', aOn ? '#22c55e' : '#64748b', 'outer', [-0.15, 0.15, 0]);
          registerEntity(wB, 'vm-b', 'Шина B', bOn ? '#22c55e' : '#64748b', 'outer', [-0.15, -0.15, 0]);
          registerEntity(wSel, 'vm-sel', 'Керуюча лінія C', cOn ? '#f59e0b' : '#64748b', 'outer', [0, -0.2, 0]);

          const muxBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.62, 0.95, 4),
            new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.5, roughness: 0.25 })
          );
          muxBody.rotation.z = -Math.PI / 2;
          muxBody.rotation.x = Math.PI / 4;
          registerEntity(muxBody, 'vm-body', `Комутатор MUX 2-в-1 (Активний: ${cOn ? 'B' : 'A'})`, '#818cf8', 'middle', [0, 0, 0]);
          itemsList.push({ id: 'vm-body', name: `MUX 2-в-1 (${cOn ? 'Канал B' : 'Канал A'})`, color: '#818cf8' });

          const wOut = makeWire([0.48, 0, 0], [1.28, 0, 0], muxOut);
          registerEntity(wOut, 'vm-wy', 'Вихідна лінія Y', muxOut ? '#22c55e' : '#64748b', 'middle', [0.15, 0, 0]);

          const led = makePin([1.42, 0, 0], muxOut, 0.21);
          registerEntity(led, 'vm-led', `Вихід Y = ${muxOut ? 1 : 0}`, muxOut ? '#10b981' : '#475569', 'core', [0.3, 0, 0]);
          itemsList.push({ id: 'vm-led', name: `Вихід Y = ${muxOut ? 1 : 0}`, color: muxOut ? '#10b981' : '#475569' });
        } else if (modelId === 'v-decoder') {
          const codeVal = (aOn ? 2 : 0) + (bOn ? 1 : 0);
          const pinA = makePin([-1.65, 0.32, 0], aOn);
          const pinB = makePin([-1.65, -0.32, 0], bOn);
          registerEntity(pinA, 'vd-pa', `Адресний біт A1 = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.2, 0.15, 0]);
          registerEntity(pinB, 'vd-pb', `Адресний біт A0 = ${st.inB}`, bOn ? '#22c55e' : '#64748b', 'outer', [-0.2, -0.15, 0]);
          itemsList.push({ id: 'vd-pa', name: `Адреса A1 = ${st.inA}`, color: aOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vd-pb', name: `Адреса A0 = ${st.inB}`, color: bOn ? '#22c55e' : '#64748b' });

          const wA = makeWire([-1.65, 0.32, 0], [-0.55, 0.32, 0], aOn);
          const wB = makeWire([-1.65, -0.32, 0], [-0.55, -0.32, 0], bOn);
          registerEntity(wA, 'vd-wa', 'Шина A1', aOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);
          registerEntity(wB, 'vd-wb', 'Шина A0', bOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);

          const decChip = new THREE.Mesh(
            new THREE.BoxGeometry(0.95, 1.35, 0.32),
            new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.45, roughness: 0.25 })
          );
          decChip.position.set(-0.05, 0, 0);
          registerEntity(decChip, 'vd-chip', `Дешифратор 2-в-4 (Активний вихід: Y${codeVal})`, '#38bdf8', 'middle', [0, 0, 0]);
          itemsList.push({ id: 'vd-chip', name: `Дешифратор (Y${codeVal})`, color: '#38bdf8' });

          [0, 1, 2, 3].forEach((idx) => {
            const py = 0.54 - idx * 0.36;
            const activeLine = codeVal === idx;
            const wOut = makeWire([0.45, py, 0], [1.28, py, 0], activeLine);
            const led = makePin([1.42, py, 0], activeLine, 0.14);
            registerEntity(wOut, `vd-wy-${idx}`, `Лінія Y${idx}`, activeLine ? '#22c55e' : '#64748b', 'middle', [0.15, 0, 0]);
            registerEntity(led, `vd-y-${idx}`, `Вихід Y${idx} = ${activeLine ? 1 : 0}`, activeLine ? '#10b981' : '#475569', 'core', [0.25, 0, 0]);
            itemsList.push({ id: `vd-y-${idx}`, name: `Y${idx} = ${activeLine ? 1 : 0}`, color: activeLine ? '#10b981' : '#475569' });
          });
        } else if (modelId === 'v-latch') {
          const qState = aOn && !bOn ? true : !aOn && bOn ? false : cOn;
          const qBarState = !qState;

          const pinS = makePin([-1.65, 0.42, 0], aOn);
          const pinR = makePin([-1.65, -0.42, 0], bOn);
          registerEntity(pinS, 'vl-ps', `Вхід встановлення S (Set) = ${st.inA}`, aOn ? '#22c55e' : '#64748b', 'outer', [-0.2, 0.2, 0]);
          registerEntity(pinR, 'vl-pr', `Вхід скидання R (Reset) = ${st.inB}`, bOn ? '#ef4444' : '#64748b', 'outer', [-0.2, -0.2, 0]);
          itemsList.push({ id: 'vl-ps', name: `Set (S) = ${st.inA}`, color: aOn ? '#22c55e' : '#64748b' });
          itemsList.push({ id: 'vl-pr', name: `Reset (R) = ${st.inB}`, color: bOn ? '#ef4444' : '#64748b' });

          const wS = makeWire([-1.65, 0.42, 0], [-0.45, 0.42, 0], aOn);
          const wR = makeWire([-1.65, -0.42, 0], [-0.45, -0.42, 0], bOn);
          registerEntity(wS, 'vl-ws', 'Шина S', aOn ? '#22c55e' : '#64748b', 'outer', [0, 0, 0]);
          registerEntity(wR, 'vl-wr', 'Шина R', bOn ? '#ef4444' : '#64748b', 'outer', [0, 0, 0]);

          const gTop = makeGateBody('NAND', [0.0, 0.42, 0], 0.8);
          const gBot = makeGateBody('NAND', [0.0, -0.42, 0], 0.8);
          registerEntity(gTop, 'vl-gtop', 'Верхній вентиль зворотного зв’язку', '#e11d48', 'middle', [0, 0.15, 0]);
          registerEntity(gBot, 'vl-gbot', 'Нижній вентиль зворотного зв’язку', '#e11d48', 'middle', [0, -0.15, 0]);

          const fb1 = makeWire([0.45, 0.35, 0], [-0.35, -0.32, 0], qState, 0.022);
          const fb2 = makeWire([0.45, -0.35, 0], [-0.35, 0.32, 0], qBarState, 0.022);
          registerEntity(fb1, 'vl-fb1', 'Перехресний зворотний зв’язок Q → R', qState ? '#22c55e' : '#64748b', 'middle', [0, 0, 0]);
          registerEntity(fb2, 'vl-fb2', 'Перехресний зворотний зв’язок ~Q → S', qBarState ? '#f59e0b' : '#64748b', 'middle', [0, 0, 0]);

          const wQ = makeWire([0.45, 0.42, 0], [1.32, 0.42, 0], qState);
          const wQb = makeWire([0.45, -0.42, 0], [1.32, -0.42, 0], qBarState);
          const ledQ = makePin([1.45, 0.42, 0], qState, 0.18);
          const ledQb = makePin([1.45, -0.42, 0], qBarState, 0.18);
          registerEntity(wQ, 'vl-wq', 'Вихідна шина Q', qState ? '#22c55e' : '#64748b', 'middle', [0.1, 0.1, 0]);
          registerEntity(wQb, 'vl-wqb', 'Інверсна шина ~Q', qBarState ? '#f59e0b' : '#64748b', 'middle', [0.1, -0.1, 0]);
          registerEntity(ledQ, 'vl-q', `Прямий вихід пам’яті Q = ${qState ? 1 : 0}`, qState ? '#10b981' : '#475569', 'core', [0.25, 0.15, 0]);
          registerEntity(ledQb, 'vl-qb', `Інверсний вихід ~Q = ${qBarState ? 1 : 0}`, qBarState ? '#f59e0b' : '#475569', 'core', [0.25, -0.15, 0]);
          itemsList.push({ id: 'vl-q', name: `Пам’ять Q = ${qState ? 1 : 0}`, color: qState ? '#10b981' : '#475569' });
          itemsList.push({ id: 'vl-qb', name: `Інверсний ~Q = ${qBarState ? 1 : 0}`, color: qBarState ? '#f59e0b' : '#475569' });
        }
      }

      setSceneItems(itemsList);
    };

    buildModelById(activeModelId);

    let lastW = 0;
    let lastH = 0;
    const syncViewportSize = () => {
      if (!container) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    };
    resizeHandlerRef.current = syncViewportSize;

    const resizeObserver = new ResizeObserver(() => {
      syncViewportSize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', syncViewportSize);

    apiRef.current.zoomIn = () => {
      camera.position.lerp(controls.target, 0.2);
      controls.update();
    };
    apiRef.current.zoomOut = () => {
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      camera.position.addScaledVector(dir, 0.25);
      controls.update();
    };
    apiRef.current.resetCamera = () => {
      const verilogActive = liveFlagsRef.current.activeModelId.startsWith('v-');
      if (verilogActive) {
        camera.position.set(0, 1.55, 6.2);
      } else {
        camera.position.set(0, 1.85, 5.2);
      }
      controls.target.set(0, 1.15, 0);
      controls.update();
    };
    apiRef.current.focusOnObject = (id) => {
      const obj = objectMap.get(id);
      if (!obj) return;
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      controls.target.copy(wp);
      camera.position.set(wp.x + 1.2, wp.y + 0.9, wp.z + 2.1);
      controls.update();
    };
    apiRef.current.loadModel = (id) => {
      buildModelById(id);
      if (id.startsWith('v-')) {
        camera.position.set(0, 1.55, 6.2);
      } else {
        camera.position.set(0, 1.85, 5.2);
      }
      controls.target.set(0, 1.15, 0);
      controls.update();
    };
    apiRef.current.getObjectWorldPos = (id) => {
      const obj = objectMap.get(id);
      if (!obj) return null;
      const wp = new THREE.Vector3();
      obj.getWorldPosition(wp);
      return wp;
    };
    apiRef.current.clearMeasureLine = () => {
      while (measureGroup.children.length > 0) measureGroup.remove(measureGroup.children[0]);
    };
    apiRef.current.drawMeasureLine = (p1, p2) => {
      apiRef.current.clearMeasureLine();
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8 }));
      measureGroup.add(line);
    };
    apiRef.current.enterVR = async () => {
      if (!navigator.xr) {
        setXrMessage('WebXR недоступний у цьому браузері (доступний 3D-режим)');
        setTimeout(() => setXrMessage(''), 4000);
        return;
      }
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-vr');
        if (!supported) {
          setXrMessage('VR-шолом не підключено — активний інтерактивний 3D-огляд');
          setTimeout(() => setXrMessage(''), 4000);
          return;
        }
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor'],
        });
        renderer.xr.setSession(session);
      } catch (err) {
        setXrMessage('Не вдалося відкрити VR-сесію: ' + err.message);
        setTimeout(() => setXrMessage(''), 4000);
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(rootGroup.children, true);
      if (hits.length > 0) {
        let hitObj = hits[0].object;
        while (hitObj && !hitObj.userData?.entityId && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        if (hitObj?.userData?.entityId) {
          handleSelectEntity(hitObj.userData.entityId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      syncViewportSize();
      const dt = clock.getDelta();
      const flags = liveFlagsRef.current;

      gridHelper.visible = flags.showGrid;
      controls.update();

      if (flags.isPlaying) {
        if (flags.activeModelId.startsWith('v-')) {
          rootGroup.rotation.y = Math.sin(clock.elapsedTime * 0.65) * 0.22;
        } else {
          rootGroup.rotation.y += dt * (0.15 + flags.simValue * 0.015);
        }
      }

      objectMap.forEach((mesh, id) => {
        const ud = mesh.userData;
        mesh.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.wireframe = flags.wireframe;
          }
        });
        if (flags.layerFilter === 'all') {
          mesh.visible = true;
        } else {
          mesh.visible = ud.layerGroup === flags.layerFilter;
        }

        const targetPos = ud.basePos.clone();
        if (flags.exploded) {
          targetPos.add(ud.explodeVec);
        } else if (flags.assemblyMode && !flags.assembledIds.includes(id)) {
          targetPos.add(ud.explodeVec.clone().multiplyScalar(1.6));
        }
        mesh.position.lerp(targetPos, 0.12);
      });

      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncViewportSize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, [themeId, activeModelId, verilogState.inA, verilogState.inB, verilogState.inC, verilogState.gateMode]);

  useEffect(() => {
    resizeHandlerRef.current();
    const timers = [50, 120, 200, 320].map((ms) => setTimeout(() => resizeHandlerRef.current(), ms));
    return () => timers.forEach(clearTimeout);
  }, [leftState, rightState]);

  return (
    <main className="flex-1 basis-0 relative min-w-0 h-full overflow-hidden flex items-center justify-center transition-all duration-300 ease-in-out">
      <div ref={mountRef} className="w-full h-full block" />
    </main>
  );
}

