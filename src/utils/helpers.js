import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function loadModel(file) {
  return new Promise((res, rej) => {
    const loader = new GLTFLoader();
    loader.load(
      file,
      function (root) {
        res(root.scene);
      },
      undefined,
      function (error) {
        rej(error);
      }
    );
  });
}

export async function setupWebcam() {
  return new Promise((resolve, reject) => {
    const webcamElement = document.querySelector("#webcam");

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (stream) {
          webcamElement["srcObject"] = stream;
          webcamElement.addEventListener("loadeddata", resolve, false);
        } else {
          reject("No webcam found");
        }
      })
      .catch((err) => reject(err));
  });
}

export function setText(text) {
  document.getElementById("status").innerText = text;
}
