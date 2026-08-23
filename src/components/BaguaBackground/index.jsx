import { useEffect, useRef } from 'react';
import { createBaguaExperience } from './scene.js';

export default function BaguaBackground({ handData, isGestureMode }) {
  const canvasRef = useRef(null);
  const experienceRef = useRef(null);
  const lastState = useRef('hidden');

  // 初始化场景
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // 初始化 Vanilla Three.js 体验
    const experience = createBaguaExperience(canvasRef.current, (state) => {
      lastState.current = state;
    });
    
    experienceRef.current = experience;

    return () => {
      // 没有任何清理机制在原本的scene里面，我们可以简单忽略
    };
  }, []);

  // 将手势数据桥接到场景
  useEffect(() => {
    if (!experienceRef.current || !isGestureMode || !handData) return;
    const exp = experienceRef.current;
    const { gesture, points, metrics } = handData;

    // 当手势从 none 恢复或持续时，驱动画面
    if (gesture === 'point' && points && points.length >= 9) {
      // 使用指尖(8)在屏幕上的位置
      const target = exp.screenToWorld(
        points[8].x * window.innerWidth,
        points[8].y * window.innerHeight
      );
      
      const intensity = metrics?.fingerLength 
        ? Math.max(0.35, Math.min(1, (metrics.fingerLength - 0.045) / 0.13))
        : 1;

      if (exp.state === 'hidden') {
        exp.summon(target.x, target.y);
      } else if (exp.state === 'seed') {
        exp.moveSeed(target.x, target.y);
        exp.setSeedIntensity(intensity);
      }
    }

    if (gesture === 'fist') {
      if (exp.state === 'seed') {
        exp.flatten();
      } else if (exp.state === 'rising' || exp.state === 'risen') {
        exp.flattenBack();
      } else if (exp.state === 'hidden') {
        // 如果一开始就是fist，直接summon然后flatten
        exp.summon(0, 0);
        setTimeout(() => exp.flatten(), 100);
      }
    }

    if (gesture === 'palm' && metrics?.palm && metrics?.roll !== undefined) {
      if (exp.state === 'flat') {
        exp.rise();
      } else if (exp.state === 'risen') {
        const neutral = {
          x: metrics.palm.x,
          y: metrics.palm.y,
          roll: metrics.roll
        };
        exp.guide(metrics.palm.x, metrics.palm.y, metrics.roll, neutral);
      }
    }

  }, [handData, isGestureMode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000 ${isGestureMode ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: '#030806' // 暗色背景，贴合原版设计
      }}
    />
  );
}
