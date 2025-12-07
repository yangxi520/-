import React from 'react';
import { useTexture } from '@react-three/drei';
import coinYangTexture from '../assets/coin_yang.png';
import coinYinTexture from '../assets/coin_yin.png';

export function TestCoin() {
    const [yangMap, yinMap] = useTexture([coinYangTexture, coinYinTexture]);

    return (
        <mesh rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[1, 1, 0.2, 32]} />
            <meshStandardMaterial
                color="#FFD700"
                metalness={0.6}
                roughness={0.4}
                map={yangMap} // Apply texture to side? No, cylinder mapping is tricky.
            />
            {/* Top Face (Yin) */}
            <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1, 32]} />
                <meshStandardMaterial map={yinMap} transparent />
            </mesh>
            {/* Bottom Face (Yang) */}
            <mesh position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[1, 32]} />
                <meshStandardMaterial map={yangMap} transparent />
            </mesh>
        </mesh>
    );
}
