/**
 * gestureDetector.js — 手势识别工具模块
 *
 * 从 hui-gesture-bagua (https://github.com/huzoukai/hui-gesture-bagua) 提取并改写的
 * 手势分类逻辑。原项目许可证：PolyForm Noncommercial License 1.0.0
 * Required Notice: Copyright 2026 科技回锅肉
 *
 * 本模块负责：
 * 1. 初始化 MediaPipe Hands
 * 2. 从手部关键点判断手势类型（握拳/张掌/指点/无）
 * 3. 检测「握拳→张掌」投掷动作序列
 */

// ---- Geometry helpers (from hui-gesture-bagua/src/gestures.js) ----

export function distance2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mirrorLandmarks(landmarks) {
  return landmarks.map((point) => ({
    x: 1 - point.x,
    y: point.y,
    z: point.z ?? 0
  }));
}

// ---- Gesture classification ----

/**
 * Classify hand gesture from MediaPipe landmarks.
 * @param {Array<{x:number,y:number,z?:number}>} landmarks - 21 hand landmarks
 * @returns {'fist'|'palm'|'point'|'none'}
 */
export function classifyGesture(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) {
    return 'none';
  }

  const points = mirrorLandmarks(landmarks);
  const wrist = points[0];

  // Compute tip-to-wrist / base-to-wrist ratios for each finger
  const fingers = [
    { tip: 8, base: 5, name: 'index' },
    { tip: 12, base: 9, name: 'middle' },
    { tip: 16, base: 13, name: 'ring' },
    { tip: 20, base: 17, name: 'pinky' }
  ];

  const ratios = {};
  for (const { tip, base, name } of fingers) {
    const tipDist = distance2d(points[tip], wrist);
    const baseDist = Math.max(distance2d(points[base], wrist), 0.001);
    ratios[name] = tipDist / baseDist;
  }

  // Thumb: use tip(4) vs IP joint(2) distance to wrist
  const thumbTipDist = distance2d(points[4], wrist);
  const thumbBaseDist = Math.max(distance2d(points[2], wrist), 0.001);
  ratios.thumb = thumbTipDist / thumbBaseDist;

  // Count extended fingers (ratio > threshold means finger is extended)
  const EXTEND_THRESHOLD = 1.35;
  const CURL_THRESHOLD = 0.95;

  const extended = Object.entries(ratios).filter(
    ([, ratio]) => ratio > EXTEND_THRESHOLD
  );
  const curled = Object.entries(ratios).filter(
    ([, ratio]) => ratio < CURL_THRESHOLD
  );

  // Point: only index extended, others curled (check before fist to avoid
  // misclassifying a pointing hand as a fist)
  if (
    ratios.index > EXTEND_THRESHOLD &&
    ratios.middle < CURL_THRESHOLD &&
    ratios.ring < CURL_THRESHOLD &&
    ratios.pinky < CURL_THRESHOLD
  ) {
    return 'point';
  }

  // Fist: most fingers curled (4+ out of 5)
  if (curled.length >= 4) {
    return 'fist';
  }

  // Palm: most fingers extended (4+ out of 5)
  if (extended.length >= 4) {
    return 'palm';
  }

  return 'none';
}

// ---- Throw detection ----

/**
 * Detect a "throw" gesture: fist held for N frames.
 * Returns true when the fist is detected for the required duration.
 */
export function createThrowDetector(options = {}) {
  const {
    fistFramesRequired = 4,   // must hold fist for at least this many frames to trigger
    cooldownFrames = 30       // after a throw, ignore for this many frames
  } = options;

  let fistCount = 0;
  let cooldown = 0;

  return function detect(gesture) {
    if (cooldown > 0) {
      cooldown--;
      return false;
    }

    if (gesture === 'fist') {
      fistCount++;
      if (fistCount >= fistFramesRequired) {
        // Trigger throw on fist!
        fistCount = 0;
        cooldown = cooldownFrames;
        return true;
      }
    } else {
      fistCount = 0;
    }

    return false;
  };
}

// ---- MediaPipe initialization ----

/**
 * Initialize MediaPipe Hands on a video element.
 * @param {HTMLVideoElement} videoElement
 * @param {(gesture: string, landmarks: Array) => void} onFrame
 * @returns {Promise<() => void>} cleanup function
 */
export async function initHandTracking(videoElement, onFrame) {
  // Dynamic import to keep MediaPipe out of main bundle
  const { Hands } = await import('@mediapipe/hands');

  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,   // 0 = lite (faster), 1 = full
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
  });

  const throwDetector = createThrowDetector();

  hands.onResults((results) => {
    const landmarks = results.multiHandLandmarks?.[0];
    if (!landmarks) {
      onFrame('none', null, false);
      return;
    }
    const gesture = classifyGesture(landmarks);
    const isThrow = throwDetector(gesture);
    onFrame(gesture, landmarks, isThrow);
  });

  // Start processing loop
  let rafId = 0;
  let running = true;

  async function processFrame() {
    if (!running) return;
    if (videoElement.readyState >= 2) {
      try {
        await hands.send({ image: videoElement });
      } catch {
        // Ignore transient send errors (e.g. during cleanup)
      }
    }
    rafId = requestAnimationFrame(processFrame);
  }

  rafId = requestAnimationFrame(processFrame);

  // Return cleanup function
  return () => {
    running = false;
    cancelAnimationFrame(rafId);
    hands.close();
  };
}
