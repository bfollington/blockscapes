import React, { Suspense, useMemo, useRef } from "react";
import "./App.css";
import { Canvas, useFrame, Vector3 } from "@react-three/fiber";
import { Box, OrbitControls, Sky } from "@react-three/drei";
import { fxhash, fxrand, registerFeatures } from "./fxhash";
import GrassBlock, { InstancedBlock } from "./GrassBlock";
import * as THREE from "three";

import * as ROT from "rot-js";
import { Noise } from "noisejs";
import dirt from "./resources/single-block-dirt.glb";
import model from "./resources/single-block.glb";
import model2 from "./resources/single-block-flower.glb";
import model3 from "./resources/single-block-grassy.glb";
import { Group } from "three";

export const GRID = 0.25;
const W = 32;
const H = 32;
const D = 16;
const NOISE_SCALE = 0.1;

const World = () => {
  // const blocks = useMemo(() => {
  //   ROT.RNG.setSeed(123);
  //   const blocks = [] as [number, number, number][];
  //   // const maze = new ROT.Map.DividedMaze(W, H);
  //   const maze = new ROT.Map.Cellular(W, H);
  //   maze.randomize(0.5);
  //   maze.create(() => {});
  //   maze.create(() => {});
  //   maze.create((x, y, i) => {
  //     if (i > 0) {
  //       blocks.push([x, y, i]);
  //     }
  //   });
  //   console.log(blocks);

  //   return blocks;
  // }, []);

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

  const blocks = useMemo(() => {
    const n = new Noise();
    // n.seed(123);
    n.seed(fxrand());
    const blocks = [] as [number, number, number, number][];

    for (let x = 0; x < W; x++) {
      for (let y = 0; y < D; y++) {
        for (let z = 0; z < H; z++) {
          const p = n.perlin2(x * NOISE_SCALE, z * NOISE_SCALE);
          if (p > 0) {
            const count = Math.round(p * D);
            for (let i = 0; i < count; i++) {
              blocks.push([x, i, z, p]);
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
            blocks.push([x, y, z, y === -1 ? 0.3 : -1]);
          }
        }
      }
    }

    return blocks;
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
        {/* {blocks.map(([x, y, z]) => (
    <GrassBlock
      key={`${x},${y},${z}`}
      position={[x * GRID, y * GRID, z * GRID]}
    />
  ))} */}

        <InstancedBlock
          model={model}
          blocks={blocks.filter(([, , , p]) => p > 0.15 && p > 0)}
        />
        <InstancedBlock
          model={model2}
          blocks={blocks.filter(([, , , p]) => p <= 0.15 && p > 0)}
        />
        <InstancedBlock
          model={dirt}
          blocks={blocks.filter(([, , , p]) => p === -1)}
        />
      </group>
    </group>
  );
};

function App() {
  console.log(fxhash());
  console.log(fxrand());

  // WARNING: do not include meaningless or testing features in your release build
  registerFeatures({ hello: "world" });

  const floor = useMemo(() => {}, []);

  return (
    <div className="App">
      <Canvas camera={{ position: [4, 4, 4] }} gl={{}}>
        <color attach="background" args={["black"]} />

        <pointLight
          position={[-3, 4, 3]}
          color={new THREE.Color(fxrand(), fxrand(), fxrand())}
          intensity={0.5 * fxrand()}
        />
        <pointLight
          position={[3, 4, -3]}
          color={new THREE.Color(fxrand(), fxrand(), fxrand())}
          intensity={0.5 * fxrand()}
        />
        <Suspense fallback={null}>
          <World />
        </Suspense>
        <OrbitControls
          minPolarAngle={Math.PI / 10}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}

export default App;
