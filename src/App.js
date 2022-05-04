import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./App.css";
import { drawLine, loadModel, setText, setupWebcam } from "./utils/helpers";
import { load, SupportedPackages } from "@tensorflow-models/face-landmarks-detection";

// let output = null;
let model = null;
// let renderer = null;
// let scene = null;
// let camera = null;
let glasses = null;

// Scene

function App() {
  const [output, setOutput] = useState(null);

  const videoRef = useRef();
  const canvasOutputRef = useRef();
  const overlayRef = useRef();

  const scene = useCallback(() => new THREE.Scene(), [])();
  const camera = useCallback(() => new THREE.PerspectiveCamera(45, 1, 0.1, 2000), [])();
  const renderer = useCallback(
    () =>
      new THREE.WebGLRenderer({
        canvas: overlayRef.current,
        alpha: true,
      }),
    []
  )();

  const trackFace = useCallback(async () => {
    // const video = document.querySelector("video");
    const video = videoRef.current;
    output.drawImage(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
    renderer.render(scene, camera);

    const faces = await model.estimateFaces({
      input: video,
      returnTensors: false,
      flipHorizontal: false,
    });

    faces.forEach((face) => {
      // Draw the bounding box
      const x1 = face.boundingBox.topLeft[0];
      const y1 = face.boundingBox.topLeft[1];
      const x2 = face.boundingBox.bottomRight[0];
      const y2 = face.boundingBox.bottomRight[1];
      // const bWidth = x2 - x1;
      // const bHeight = y2 - y1;
      drawLine(output, x1, y1, x2, y1);
      drawLine(output, x2, y1, x2, y2);
      drawLine(output, x1, y2, x2, y2);
      drawLine(output, x1, y1, x1, y2);

      glasses.position.x = face.annotations.midwayBetweenEyes[0][0];
      glasses.position.y = -face.annotations.midwayBetweenEyes[0][1];
      glasses.position.z = -camera.position.z + face.annotations.midwayBetweenEyes[0][2];

      // Calculate an Up-Vector using the eyes position and the bottom of the nose
      glasses.up.x = face.annotations.midwayBetweenEyes[0][0] - face.annotations.noseBottom[0][0];
      glasses.up.y = -(
        face.annotations.midwayBetweenEyes[0][1] - face.annotations.noseBottom[0][1]
      );
      glasses.up.z = face.annotations.midwayBetweenEyes[0][2] - face.annotations.noseBottom[0][2];
      const length = Math.sqrt(glasses.up.x ** 2 + glasses.up.y ** 2 + glasses.up.z ** 2);
      glasses.up.x /= length;
      glasses.up.y /= length;
      glasses.up.z /= length;

      // Scale to the size of the head
      const eyeDist = Math.sqrt(
        (face.annotations.leftEyeUpper1[3][0] - face.annotations.rightEyeUpper1[3][0]) ** 2 +
          (face.annotations.leftEyeUpper1[3][1] - face.annotations.rightEyeUpper1[3][1]) ** 2 +
          (face.annotations.leftEyeUpper1[3][2] - face.annotations.rightEyeUpper1[3][2]) ** 2
      );
      glasses.scale.x = eyeDist / 6;
      glasses.scale.y = eyeDist / 6;
      glasses.scale.z = eyeDist / 6;

      glasses.rotation.y = Math.PI;
      glasses.rotation.z = Math.PI / 2 - Math.acos(glasses.up.x);
    });

    requestAnimationFrame(trackFace);
  }, [camera, output, renderer, scene]);

  const init = useCallback(
    async (videoRef, canvasRef, overlayRef) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;

      await setupWebcam();
      // const video = document.querySelector("webcam");
      // video.play();
      let videoWidth = video.videoWidth;
      let videoHeight = video.videoHeight;
      video.width = videoWidth;
      video.height = videoHeight;

      // let canvas = document.getElementById("output");
      canvas.width = video.width;
      canvas.height = video.height;

      // let overlay = document.getElementById("overlay");
      overlay.width = video.width;
      overlay.height = video.height;

      // output = canvas.getContext("2d");
      output.translate(canvas.width, 1);
      output.scale(-1, 1); // Mirror cam
      output.fillStyle = "#fdffb6";
      output.strokeStyle = "#fdffb6";
      output.lineWidth = 2;

      // Load Face Landmarks Detection
      model = await load(SupportedPackages.mediapipeFacemesh);

      camera.position.x = videoWidth / 2;
      camera.position.y = -videoHeight / 2;
      camera.position.z = -(videoHeight / 2) / Math.tan(45 / 2); // distance to z should be tan( fov / 2 )

      // scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xcccccc, 0.4));
      camera.add(new THREE.PointLight(0xffffff, 0.8));
      scene.add(camera);

      camera.lookAt(videoWidth / 2, -videoHeight / 2, 0);

      glasses = await loadModel("heartGlasses.obj");
      scene.add(glasses);

      setText("Loaded!");
      trackFace();
    },
    [camera, output, scene, trackFace]
  );

  useEffect(() => {
    if (videoRef.current && canvasOutputRef.current && overlayRef.current) {
      setOutput(canvasOutputRef.current?.getContext("2d"));
      output && init(videoRef, canvasOutputRef, overlayRef);
    }
  }, [output, init]);

  return (
    <>
      <div className="canvas-container">
        <canvas ref={canvasOutputRef} id="output"></canvas>
        <canvas ref={overlayRef} id="overlay"></canvas>
      </div>
      <video ref={videoRef} id="webcam" playsInline autoPlay></video>
      <h1 id="status">Loading...</h1>
    </>
  );
}

export default App;
