#  SaarthiAI (सारथी AI) - Mobile Spatial Vision Assistant

> **Empowering Independence for Individuals with Visual Impairments through Intelligent Mobile Multimodal AI.**

[![SaarthiAI Demo Video](https://img.shields.io/badge/YouTube-Watch%20Demo%20Video-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=5xGxPEjW8Hg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind_css)](https://tailwindcss.com/)

 **Watch the project walkthrough and concept demonstration:** [https://www.youtube.com/watch?v=5xGxPEjW8Hg](https://www.youtube.com/watch?v=5xGxPEjW8Hg)

---

##  Overview

Visual impairments encompass a range of conditions from low vision to complete blindness that cannot be corrected with conventional eyeglasses or surgery. Visually impaired individuals face daily challenges in performing essential routine tasks, such as:
- **Navigating unfamiliar spaces & detecting immediate hazards** (stairs, curbs, obstacles, oncoming people).
- **Reading medicine prescriptions and dosage instructions**.
- **Interpreting street signs, public notices, and restaurant menus**.
- **Understanding social environments and facial expressions**.

Current assistive hardware solutions are often **prohibitively expensive ($1,000+)** or require complex subscriptions. **SaarthiAI** is a breakthrough mobile-first web application that transforms standard smartphones into an intelligent, hands-free visual guide with **zero extra hardware required**.

---

##  Key Features

### 1. Zero-Touch Voice Assistant (Instant Startup)
- **Automatic Audio Greeting**: The assistant activates the moment the application opens—no visual navigation needed.
- **Continuous Natural Voice Recognition**: Speak naturally at any time, or use hands-free keywords:
  - *"Describe scene"* / *"सामने क्या है"*
  - *"Read prescription"* / *"दवाई की पर्ची पढ़ो"*
  - *"Who is here"* / *"चेहरा पहचानो"*
  - *"Switch to Hindi"* / *"हिंदी में बोलो"*
  - *"Emergency SOS"* / *"मदद करो"*

### 2. Real-Time On-Device Computer Vision (TensorFlow.js COCO-SSD)
- **Live Optical Stream**: Utilizes the smartphone's real camera feed to detect objects, people, furniture, and hazards at 15+ FPS.
- **Proximity Radar & Distance Estimation**: Calculates distance and spatial orientation (`Left`, `Center`, `Right`).
- **Spatial Audio Earcons**: Emits directional audio pings with stereo panning matching the exact position of detected obstacles.

### 3. Multimodal Generative AI (Google Gemini Vision)
Powered by Google Gemini Multimodal Intelligence across 4 primary domains:
- **Scene Description**: Rich panoramic spatial description detailing layout, obstacles, lighting, and clear walking paths.
- **Document & Prescription Simplification**: OCR reading of medicine dosage, expiry dates, and warning labels simplified into easy-to-understand bullet points.
- **Conversational Voice Q&A**: Answers any visual question about the surroundings in real time (*"Where is the door?", "What medicine bottle is in my hand?"*).
- **Emotional & Social Context**: Identifies presence of people, facial expressions (smiling, neutral), and gestures.

### 4.Universal Tactile & Hardware Accessibility (WCAG AAA)
- **Volume & Headset Button Controls**:
  - **Volume Up / Headset Next Track**: Instantly triggers room/scene scan.
  - **Volume Down / Headset Previous Track**: Repeats the last spoken audio message.
  - **`navigator.mediaSession` Integration**: Control SaarthiAI using Bluetooth headsets or wired headphone buttons even when the phone is in your pocket.
- **Full-Screen Tactile Gestures**:
  - **Single Tap Anywhere**: Reads current obstacle radar distances.
  - **Double Tap Anywhere**: Performs a full scene scan.
  - **Long Press (Hold)**: Activates Voice Query mode.
  - **Two-Finger Swipe**: Cycles between modes.
  - **Triple Tap**: Triggers Emergency SOS.
- **High-Contrast Design**: High-contrast Yellow on Black (`#fde400` / `#0e0e0e`) and Atkinson Hyperlegible typography.

### 5.Emergency SOS System
- High-decibel pulsating auditory beacon and strobe flash.
- Real-time GPS coordinate logging and emergency responder broadcasting.
- One-tap emergency calling shortcut (112 / 911).

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS (Accessible Design Tokens)
- **Vision Engine**: `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` (On-Device Inference)
- **Multimodal AI**: Google Gemini 1.5/Flash Multimodal Vision API
- **Audio & Speech**: Web Speech API (`SpeechSynthesis` & `SpeechRecognition`) + Web Audio API Synthesizer
- **Backend & Server**: Node.js, Express.js, CORS, Dotenv
- **Deployment**: Docker, Render, Vercel



