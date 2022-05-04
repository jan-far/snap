import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function loadModel(file) {
  console.log("file", file);
  return new Promise((res, rej) => {
    const loader = new OBJLoader();
    loader.load(
      file,
      function (root) {
        console.log("root: ", root);
        res(root);
      },
      undefined,
      function (error) {
        console.log("error: ", error);
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
