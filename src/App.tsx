import React, { Suspense, useEffect, useMemo, useRef } from "react";
import "./App.css";
import { Canvas, useFrame, Vector3 } from "@react-three/fiber";
import { Box, OrbitControls, Sky, Stars } from "@react-three/drei";
import { fxhash, fxrand, registerFeatures } from "./fxhash";
import GrassBlock, { InstancedBlock } from "./GrassBlock";
import * as THREE from "three";

import * as ROT from "rot-js";
import { Noise } from "noisejs";
import dirt from "./resources/single-block-dirt.glb";
import stone from "./resources/single-block-stone.glb";
import brick from "./resources/single-block-brick.glb";
import model from "./resources/single-block.glb";
import model2 from "./resources/single-block-flower.glb";
import model3 from "./resources/single-block-grassy.glb";
import tree1 from "./resources/tree_1.png";
import tree2 from "./resources/tree_2.png";
import tree3 from "./resources/tree_3.png";
import { Group } from "three";
import { usePixelTexture } from "use-spritesheet/lib";
import { choose } from "./list";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";

function key(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}
export const GRID = 0.25;
export const W = 48;
export const H = 48;
export const D = 16;
const NOISE_SCALE = 0.05 + fxrand() * 0.07;
const tallness = Math.round(D / 2 + fxrand() * (D / 2));

registerFeatures({ tallness: tallness, scale: NOISE_SCALE });

const World = () => {
  // const blocks = useMemo(() => {
  //   const n = new Noise();
  //   n.seed(123);
  //   const blocks = [] as [number, number, number, number][];

  //   for (let x = 0; x < W; x++) {
  //     for (let y = 0; y < D; y++) {
  //       for (let z = 0; z < H; z++) {
  //         const p = n.perlin3(
  //           x * NOISE_SCALE,
  //           y * NOISE_SCALE,
  //           z * NOISE_SCALE
  //         );
  //         if (p > 0) {
  //           blocks.push([x, y, z, p]);
  //         }
  //       }
  //     }
  //   }

  //   return blocks;
  // }, []);

  const buildingPosition = useMemo(() => {
    return [
      Math.round(fxrand() * (W - 10) + 5),
      Math.round(fxrand() * (H - 10) + 5),
    ];
  }, []);

  const [blocks, occupancyMap] = useMemo(() => {
    const n = new Noise();
    // n.seed(123);
    n.seed(fxrand());
    const blocks = [] as [number, number, number, number][];
    const occupancyMap: { [id: string]: number } = {};

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < D; y++) {
        for (let z = 0; z < H; z++) {
          let p = n.perlin2(x * NOISE_SCALE, z * NOISE_SCALE);
          if (y === 0) {
            p += 0.1;
          }
          if (p > 0) {
            const count = Math.round(p * tallness);
            for (let i = 0; i < count; i++) {
              blocks.push([x, i, z, p]);
              occupancyMap[key(x, i, z)] = 1;
            }
          }
        }
      }
    }

    for (let x = 0; x < W; x++) {
      for (let y = -1; y > -D / 2; y--) {
        for (let z = 0; z < H; z++) {
          const p = n.perlin3(
            x * NOISE_SCALE,
            y * NOISE_SCALE,
            z * NOISE_SCALE
          );
          if (p > 0) {
            blocks.push([x, y, z, y === -1 ? (p > 0.25 ? -2 : -1) : -1]);
            occupancyMap[key(x, y, z)] = 1;
          }
        }
      }
    }

    return [blocks, occupancyMap, tallness];
  }, []);

  const ref = useRef<Group>();
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={ref}>
      <group position={[-(GRID * W) / 2, 0, -(GRID * H) / 2]}>
        <InstancedBlock
          model={model3}
          blocks={blocks.filter(([, , , p]) => p > 0.5 && p > 0)}
        />
        <InstancedBlock
          model={model}
          blocks={blocks.filter(([, , , p]) => p > 0.15 && p < 0.5 && p > 0)}
        />
        <InstancedBlock
          model={model2}
          blocks={blocks.filter(([, , , p]) => p <= 0.15 && p > 0)}
        />
        <InstancedBlock
          model={dirt}
          blocks={blocks.filter(
            ([, y, , p]) => (p === -1 || p === -2) && y > -5
          )}
        />
        <InstancedBlock
          model={stone}
          blocks={blocks.filter(
            ([, y, , p]) => (p === -1 || p === -2) && y <= -5
          )}
        />
        {/* <Building occupancyMap={occupancyMap} gridPosition={buildingPosition} /> */}
        {blocks
          .filter(([x, y, z, p]) => {
            return y === -1 && p === -2;
          })
          .map(([x, y, z, p]) => (
            <Tree position={[x * GRID, y * GRID + 0.33, z * GRID]} />
          ))}
      </group>
    </group>
  );
};

const Building = (props: any) => {
  const occupancy = props.occupancyMap;
  const [ox, oy] = props.gridPosition;

  const blocks = useMemo(() => {
    const castleHeight = Math.round(fxrand() * 5) + 5;
    const castleWidth = Math.round(fxrand() * 3) + 5;
    const castleDepth = Math.round(fxrand() * 3) + 5;
    ROT.RNG.setSeed(fxrand());
    const blocks = [] as [number, number, number, number][];
    const maze = new ROT.Map.DividedMaze(castleWidth, castleDepth);
    // const maze = new ROT.Map.Cellular(W, H);
    maze.create((x, y, i) => {
      if (i > 0) {
        for (let h = 0; h < castleHeight; h++) {
          if (!occupancy[key(ox + x, h, oy + y)]) {
            blocks.push([x + ox, h, oy + y, 0]);
          }
        }
      }
    });

    return blocks;
  }, []);

  return (
    <group {...props}>
      <InstancedBlock model={brick} blocks={blocks} />
    </group>
  );
};

const Tree = (props: any) => {
  const src = useMemo(() => choose([tree2, tree3]), []);
  const tex = usePixelTexture(src, false);

  return (
    <sprite {...props} scale={[0.5, 0.5, 0.5]}>
      <spriteMaterial map={tex} transparent />
    </sprite>
  );
};

function App() {
  return (
    <div className="App">
      <Canvas camera={{ position: [8, 8, 8], zoom: 1 }} gl={{}}>
        {/* <Sky azimuth={0.05} inclination={0.05} distance={1000} /> */}
        <Stars />
        <color attach="background" args={["#050609"]} />

        <pointLight
          position={[-3, 10, 2.5]}
          color="orange"
          intensity={0.5 * fxrand()}
        />
        <pointLight
          position={[3, 10, -2.5]}
          color="purple"
          intensity={0.5 * fxrand()}
        />
        <Suspense fallback={null}>
          <group position={[0, 3, 0]}>
            <World />
          </group>
        </Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 10}
          maxPolarAngle={Math.PI / 1.5}
        />
        <EffectComposer>
          {/* <DepthOfField
            focusDistance={0}
            focalLength={0.02}
            bokehScale={2}
            height={480}
          /> */}
          <Bloom
            luminanceThreshold={0.3}
            luminanceSmoothing={0.6}
            height={300}
          />
          <Vignette eskil={false} offset={0.1} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

export default App;
