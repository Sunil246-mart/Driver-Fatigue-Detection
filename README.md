# 🚗 Driver Fatigue Detection System

A real-time web-based system that detects **driver drowsiness** and **facial expressions** using `face-api.js` and your webcam. This system can help prevent accidents by alerting drivers when signs of fatigue are detected.

---

## 📸 How It Works

- Uses your **webcam** to capture live video.
- Detects **facial landmarks** and computes **Eye Aspect Ratio (EAR)**.
- If eyes are closed for a certain number of frames, the system triggers a **drowsiness alert**.
- Also detects **facial expressions** like happy, sad, angry, etc.

---

## 💡 Features

- 🔍 Real-time face and eye tracking in the browser.
- ⚠️ Visual and audio alerts for drowsiness.
- 🧠 Emotion classification using pre-trained face-api.js models.
- 🌐 No server required – runs fully on the client side!

---

## 🛠️ Technologies Used

- HTML, CSS, JavaScript
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- WebRTC (getUserMedia API)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/driver-fatigue-detection.git
cd driver-fatigue-detection
