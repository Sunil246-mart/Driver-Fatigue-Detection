const EAR_THRESHOLD = 0.25;
const EAR_CONSEC_FRAMES = 15; // About 0.5s at ~30fps

let closedEyesFrames = 0;
let drowsy = false;

const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const alertBox = document.getElementById('alertBox');
const expressionBox = document.getElementById('expressionBox');
const ctx = canvas.getContext('2d');

function playAlertSound() {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, context.currentTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 1);
  setTimeout(() => {
    oscillator.stop();
    context.close();
  }, 1200);
}

function calculateEAR(eye) {
  function dist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  video.srcObject = stream;
}

async function onPlay() {
  const displaySize = { width: video.videoWidth, height: video.videoHeight };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections) {
      const resized = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawFaceLandmarks(canvas, resized);

      // EAR Calculation
      const leftEye = resized.landmarks.getLeftEye();
      const rightEye = resized.landmarks.getRightEye();
      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      if (avgEAR < EAR_THRESHOLD) {
        closedEyesFrames++;
        if (closedEyesFrames >= EAR_CONSEC_FRAMES && !drowsy) {
          drowsy = true;
          alertBox.style.display = 'block';
          playAlertSound();
        }
      } else {
        closedEyesFrames = 0;
        drowsy = false;
        alertBox.style.display = 'none';
      }

      // Expression
      const expressions = detections.expressions;
      const maxExp = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      expressionBox.textContent = `Expression: ${maxExp}`;
    } else {
      alertBox.style.display = 'none';
      expressionBox.textContent = 'Detecting...';
    }
  }, 100);
}

// Load models and start
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
  faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
  faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights')
]).then(startVideo).then(() => {
  video.addEventListener('playing', onPlay);
});
