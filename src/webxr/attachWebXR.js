import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const STAGE_OFFSET = new THREE.Vector3(0, 0, -2.4);

function findEntity(object) {
  let current = object;
  while (current && !current.userData?.entityId && current.parent) {
    current = current.parent;
  }
  return current?.userData?.entityId ? current : null;
}

function makePointerRay() {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const material = new THREE.LineBasicMaterial({ color: 0x38bdf8 });
  const line = new THREE.Line(geometry, material);
  line.name = 'xr-pointer';
  line.scale.z = 2.5;
  return line;
}

/**
 * WebVR API знято з браузерів. Immersive-режим тепер дає WebXR Device API,
 * а точка входу в Three.js — VRButton і моделі контролерів.
 * Сцена зсувається вперед лише на час сесії, щоб модель була перед шоломом.
 */
export function attachWebXR({ renderer, scene, stage, rootGroup, controls, onSelectEntity, onSessionChange }) {
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');

  let headsetSupported = false;
  let preview = false;
  const leftEye = new THREE.PerspectiveCamera();
  const rightEye = new THREE.PerspectiveCamera();
  const size = new THREE.Vector2();

  const button = document.createElement('button');
  button.id = 'VRButton';
  button.type = 'button';
  button.textContent = 'VR PREVIEW';
  button.style.position = 'absolute';
  button.style.bottom = '16px';
  button.style.left = '50%';
  button.style.transform = 'translateX(-50%)';
  button.style.zIndex = '30';
  button.style.padding = '10px 14px';
  button.style.borderRadius = '8px';
  button.style.border = '1px solid rgba(255,255,255,0.4)';
  button.style.background = 'rgba(2, 132, 199, 0.95)';
  button.style.color = '#fff';
  button.style.font = '700 12px sans-serif';
  button.style.cursor = 'pointer';

  const paintLabel = () => {
    if (renderer.xr.isPresenting) {
      button.textContent = 'EXIT VR';
    } else if (preview) {
      button.textContent = 'EXIT VR PREVIEW';
    } else if (headsetSupported) {
      button.textContent = 'ENTER VR';
    } else {
      button.textContent = 'VR PREVIEW';
    }
  };

  const setPreview = (next) => {
    preview = next;
    paintLabel();
    onSessionChange(next ? 'preview-on' : 'preview-off');
  };

  button.onclick = () => {
    if (renderer.xr.isPresenting) {
      renderer.xr.getSession()?.end();
      return;
    }
    if (preview) {
      setPreview(false);
      return;
    }
    if (headsetSupported && navigator.xr) {
      navigator.xr
        .requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor'],
        })
        .then((session) => renderer.xr.setSession(session))
        .catch((error) => onSessionChange('error', error));
      return;
    }
    setPreview(true);
  };

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
      headsetSupported = supported;
      paintLabel();
    }).catch(() => {
      headsetSupported = false;
      paintLabel();
    });
  }

  const raycaster = new THREE.Raycaster();
  const controllerFactory = new XRControllerModelFactory();
  const rigs = [];

  const selectFromController = (controller) => {
    const aim = new THREE.Matrix4().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(aim);
    const hits = raycaster.intersectObjects(rootGroup.children, true);
    if (!hits.length) return;
    const entity = findEntity(hits[0].object);
    if (entity) onSelectEntity(entity.userData.entityId);
  };

  for (let index = 0; index < 2; index += 1) {
    const controller = renderer.xr.getController(index);
    controller.add(makePointerRay());
    const onSelect = () => selectFromController(controller);
    controller.addEventListener('select', onSelect);
    scene.add(controller);

    const grip = renderer.xr.getControllerGrip(index);
    grip.add(controllerFactory.createControllerModel(grip));
    scene.add(grip);

    rigs.push({ controller, grip, onSelect });
  }

  const onSessionStart = () => {
    preview = false;
    stage.position.copy(STAGE_OFFSET);
    controls.enabled = false;
    paintLabel();
    onSessionChange('start');
  };

  const onSessionEnd = () => {
    stage.position.set(0, 0, 0);
    controls.enabled = true;
    paintLabel();
    onSessionChange('end');
  };

  renderer.xr.addEventListener('sessionstart', onSessionStart);
  renderer.xr.addEventListener('sessionend', onSessionEnd);

  return {
    button,
    get presenting() {
      return renderer.xr.isPresenting;
    },
    get previewing() {
      return preview;
    },
    render(scene, camera) {
      renderer.getSize(size);
      if (!preview || renderer.xr.isPresenting) {
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, size.x, size.y);
        renderer.render(scene, camera);
        return;
      }

      const half = Math.max(1, Math.floor(size.x / 2));
      const eyeOffset = 0.032;
      renderer.setScissorTest(true);
      [leftEye, rightEye].forEach((eyeCamera, index) => {
        eyeCamera.copy(camera);
        const shift = new THREE.Vector3(index === 0 ? -eyeOffset : eyeOffset, 0, 0);
        shift.applyQuaternion(camera.quaternion);
        eyeCamera.position.add(shift);
        eyeCamera.aspect = half / Math.max(1, size.y);
        eyeCamera.updateProjectionMatrix();
        const x = index === 0 ? 0 : size.x - half;
        renderer.setViewport(x, 0, half, size.y);
        renderer.setScissor(x, 0, half, size.y);
        renderer.render(scene, eyeCamera);
      });
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, size.x, size.y);
    },
    async exit() {
      const session = renderer.xr.getSession();
      if (session) await session.end();
    },
    dispose() {
      renderer.xr.removeEventListener('sessionstart', onSessionStart);
      renderer.xr.removeEventListener('sessionend', onSessionEnd);
      rigs.forEach(({ controller, grip, onSelect }) => {
        controller.removeEventListener('select', onSelect);
        scene.remove(controller);
        scene.remove(grip);
      });
      const session = renderer.xr.getSession();
      if (session) session.end().catch(() => {});
      button.remove();
    },
  };
}
