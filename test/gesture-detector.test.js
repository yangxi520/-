/**
 * gesture-detector.test.js — Unit tests for gestureDetector.js
 *
 * Tests gesture classification and throw detection logic.
 * MediaPipe initialization is NOT tested here (requires browser + camera).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  distance2d,
  mirrorLandmarks,
  classifyGesture,
  createThrowDetector
} from '../src/utils/gestureDetector.js';

// ---- distance2d ----

test('distance2d: 相同点距离为零', () => {
  assert.equal(distance2d({ x: 0, y: 0 }, { x: 0, y: 0 }), 0);
});

test('distance2d: 3-4-5 三角形', () => {
  assert.equal(distance2d({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('distance2d: 支持负坐标', () => {
  assert.equal(distance2d({ x: -1, y: -1 }, { x: 2, y: 3 }), 5);
});

// ---- mirrorLandmarks ----

test('mirrorLandmarks: x 坐标镜像 (1 - x)', () => {
  const result = mirrorLandmarks([{ x: 0.3, y: 0.5, z: 0.1 }]);
  assert.equal(result.length, 1);
  assert.ok(Math.abs(result[0].x - 0.7) < 0.001);
  assert.equal(result[0].y, 0.5);
  assert.equal(result[0].z, 0.1);
});

test('mirrorLandmarks: 缺少 z 时默认为 0', () => {
  const result = mirrorLandmarks([{ x: 0.5, y: 0.5 }]);
  assert.equal(result[0].z, 0);
});

test('mirrorLandmarks: 保留数组长度', () => {
  const input = Array.from({ length: 21 }, (_, i) => ({ x: i / 21, y: 0.5 }));
  assert.equal(mirrorLandmarks(input).length, 21);
});

// ---- classifyGesture ----

/**
 * Helper: create 21 landmarks with fingers at specified extension level.
 * Extension > 1.35 = extended, < 0.95 = curled
 */
function makeLandmarks(fingerExtensions) {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

  // Wrist at bottom
  points[0] = { x: 0.5, y: 0.9, z: 0 };

  // Finger bases (knuckles) — fixed distance from wrist
  for (const baseIdx of [5, 9, 13, 17]) {
    points[baseIdx] = { x: 0.5, y: 0.7, z: 0 };
  }

  // Thumb base
  points[2] = { x: 0.5, y: 0.7, z: 0 };

  // Set finger tips based on desired extension
  const tips = { index: 8, middle: 12, ring: 16, pinky: 20 };
  for (const [name, tipIdx] of Object.entries(tips)) {
    const ext = fingerExtensions[name] ?? 0.5;
    if (ext > 1.35) {
      points[tipIdx] = { x: 0.5, y: 0.3, z: 0 }; // extended: far from wrist
    } else if (ext < 0.95) {
      points[tipIdx] = { x: 0.5, y: 0.85, z: 0 }; // curled: near wrist
    } else {
      points[tipIdx] = { x: 0.5, y: 0.6, z: 0 };
    }
  }

  // Thumb tip
  if (fingerExtensions.thumb > 1.35) {
    points[4] = { x: 0.3, y: 0.6, z: 0 };
  } else if (fingerExtensions.thumb < 0.95) {
    points[4] = { x: 0.48, y: 0.82, z: 0 };
  } else {
    points[4] = { x: 0.4, y: 0.7, z: 0 };
  }

  return points;
}

test('classifyGesture: null 输入返回 none', () => {
  assert.equal(classifyGesture(null).gesture, 'none');
});

test('classifyGesture: 空数组返回 none', () => {
  assert.equal(classifyGesture([]).gesture, 'none');
});

test('classifyGesture: 不足 21 个点返回 none', () => {
  assert.equal(classifyGesture([{ x: 0, y: 0 }]).gesture, 'none');
});

test('classifyGesture: 全部蜷缩检测为握拳', () => {
  const landmarks = makeLandmarks({
    thumb: 0.5, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5
  });
  assert.equal(classifyGesture(landmarks).gesture, 'fist');
});

test('classifyGesture: 全部伸展检测为张掌', () => {
  const landmarks = makeLandmarks({
    thumb: 2.0, index: 2.0, middle: 2.0, ring: 2.0, pinky: 2.0
  });
  assert.equal(classifyGesture(landmarks).gesture, 'palm');
});

test('classifyGesture: 仅食指伸展检测为指点', () => {
  const landmarks = makeLandmarks({
    thumb: 0.5, index: 2.0, middle: 0.5, ring: 0.5, pinky: 0.5
  });
  assert.equal(classifyGesture(landmarks).gesture, 'point');
});

// ---- createThrowDetector ----

test('createThrowDetector: 握拳足够帧数后触发投掷', () => {
  const detect = createThrowDetector({ fistFramesRequired: 3, cooldownFrames: 5 });

  assert.equal(detect('fist'), false); // 1
  assert.equal(detect('fist'), false); // 2
  assert.equal(detect('fist'), true);  // 3 -> throw!
});

test('createThrowDetector: 握拳帧数不足时不触发', () => {
  const detect = createThrowDetector({ fistFramesRequired: 5, cooldownFrames: 5 });

  assert.equal(detect('fist'), false);
  assert.equal(detect('fist'), false);
  assert.equal(detect('none'), false); // interrupted
});

test('createThrowDetector: 投掷后进入冷却期', () => {
  const detect = createThrowDetector({ fistFramesRequired: 2, cooldownFrames: 3 });

  detect('fist');
  assert.equal(detect('fist'), true); // throw!

  // Now in cooldown (3 frames)
  detect('fist'); // cooldown 1
  detect('fist'); // cooldown 2
  assert.equal(detect('fist'), false); // cooldown 3 — still cooling

  // Cooldown expired, try again
  detect('fist');
  assert.equal(detect('fist'), true); // throw again!
});

test('createThrowDetector: 中断手势会重置握拳计数', () => {
  const detect = createThrowDetector({ fistFramesRequired: 3, cooldownFrames: 2 });

  detect('fist');
  detect('fist');
  detect('none'); // interruption → reset
  detect('fist');
  detect('fist');
  assert.equal(detect('none'), false); // only 2 fist frames after reset
});

test('createThrowDetector: 随机手势切换无误触发', () => {
  const detect = createThrowDetector({ fistFramesRequired: 2, cooldownFrames: 2 });

  assert.equal(detect('none'), false);
  assert.equal(detect('point'), false);
  assert.equal(detect('palm'), false);
  assert.equal(detect('none'), false);
  assert.equal(detect('fist'), false);
  assert.equal(detect('none'), false);
  assert.equal(detect('palm'), false); // no false positives
});
