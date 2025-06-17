const EAR_THRESHOLD = 0.25;
const EAR_CONSEC_FRAMES = 15;

let closedEyesFrames = 0;
let drowsy = false;
let testMode = false;

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const alertBox = document.getElementById('alertBox');
const expressionBox = document.getElementById('expressionBox');
const loadingBox = document.getElementById('loadingBox');
const testBtn = document.getElementById('testModeBtn');

function playAlertSound() {
  const context = new AudioContext();
  const o = context.createOscillator();
  const g = context.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(440, context.currentTime);
  o.connect(g);
  g.connect(context.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 1);
  setTimeout(() => {
    o.stop();
    context.close();
  }, 1200);
}

function calculateEAR(eye) {
  const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

testBtn.addEventListener('click', () => {
  testMode = true;
  alertBox.style.display = 'block';
  playAlertSound();
  setTimeout(() => {
    alertBox.style.display = 'none';
    testMode = false;
  }, 2500);
});

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access is required for detection.");
  }
}

async function loadModels() {
  const url = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
  await faceapi.nets.tinyFaceDetector.loadFromUri(url);
  await faceapi.nets.faceLandmark68Net.loadFromUri(url);
  await faceapi.nets.faceExpressionNet.loadFromUri(url);
}

video.addEventListener('play', () => {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  canvas.width = displaySize.width;
  canvas.height = displaySize.height;

  loadingBox.style.display = 'none';

  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections) {
      const resized = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);

      const landmarks = resized.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      if (avgEAR < EAR_THRESHOLD) {
        closedEyesFrames++;
        if (closedEyesFrames >= EAR_CONSEC_FRAMES && !drowsy && !testMode) {
          drowsy = true;
          alertBox.style.display = 'block';
          playAlertSound();
        }
      } else {
        closedEyesFrames = 0;
        drowsy = false;
        alertBox.style.display = 'none';
      }

      const expressions = detections.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      expressionBox.textContent = `Expression: ${sorted[0][0]} 😐`;
    } else {
      expressionBox.textContent = 'Face Not Detected';
      alertBox.style.display = 'none';
      closedEyesFrames = 0;
      drowsy = false;
    }
  }, 100);
});

(async function () {
  await loadModels();
  await setupCamera();
})();
// 🌗 Toggle Night/Light Mode
const modeToggle = document.getElementById('modeToggle');
modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  if (document.body.classList.contains('light-mode')) {
    modeToggle.textContent = '🌙 Switch to Night Mode';
  } else {
    modeToggle.textContent = '🌞 Switch to Light Mode';
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const modeToggle = document.getElementById("modeToggle");

  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    // Optional: Update button text
    if (document.body.classList.contains("light-mode")) {
      modeToggle.textContent = "Switch to Dark Mode";
    } else {
      modeToggle.textContent = "Switch to Light Mode";
    }
  });
});
// 📸 Screenshot Function
function captureScreenshot() {
  const screenshotMsg = document.getElementById('screenshotMsg');
  const downloadLink = document.getElementById('downloadLink');

  const snapshotCanvas = document.createElement('canvas');
  snapshotCanvas.width = video.videoWidth;
  snapshotCanvas.height = video.videoHeight;
  const snapCtx = snapshotCanvas.getContext('2d');

  snapCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

  const dataURL = snapshotCanvas.toDataURL('image/png');
  screenshotMsg.style.display = 'block';
  downloadLink.href = dataURL;
  downloadLink.style.display = 'inline-block';

  setTimeout(() => {
    screenshotMsg.style.display = 'none';
    downloadLink.style.display = 'none';
  }, 10000);
}
window.addEventListener("DOMContentLoaded", () => {
  const logList = document.getElementById('eventLog');
  const stored = JSON.parse(localStorage.getItem("fatigueLogs")) || [];
  stored.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = entry;
    logList.appendChild(li);
  });
});
