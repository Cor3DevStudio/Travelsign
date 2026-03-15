# LinguaJourney - Step-by-Step Setup Guide

Welcome to LinguaJourney! This guide will walk you through setting up and running the entire system step by step.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup (Python Server)](#backend-setup-python-server)
3. [Frontend Setup (Mobile App)](#frontend-setup-mobile-app)
4. [Configuration](#configuration)
5. [Running the System](#running-the-system)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have the following installed:

### Required Software:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
- **npm** (comes with Node.js) or **yarn**
- **Expo CLI** (we'll install this in the setup)
- **Git** (optional, for cloning the repository)

### Required API Keys:
- **Google Gemini API Key** - [Get it here](https://makersuite.google.com/app/apikey)
- **Google Places API Key** (optional, for nearby places feature) - [Get it here](https://console.cloud.google.com/)

---

## Backend Setup (Python Server)

The backend server handles OCR (text extraction), translation, and nearby places search.

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create a Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies
```bash
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install manually:
```bash
pip install flask google-generativeai requests python-dotenv
```

### Step 4: Set Up Environment Variables

Create a `.env` file in the `backend` folder:

**Windows:**
```bash
# In the backend folder, create a file named .env
notepad .env
```

**Mac/Linux:**
```bash
# In the backend folder, create a file named .env
nano .env
```

Add the following content to the `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PLACES_API_KEY=your_places_api_key_here
```

**Replace:**
- `your_gemini_api_key_here` with your actual Google Gemini API key
- `your_places_api_key_here` with your Google Places API key (optional, but recommended)

### Step 5: Find Your Server's IP Address

You need to know your computer's IP address so the mobile app can connect to it.

**Windows:**
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter (WiFi or Ethernet)
4. Copy this IP address (e.g., `192.168.1.100`)

**Mac:**
1. Open Terminal
2. Type: `ifconfig | grep "inet "`
3. Look for the IP address that starts with `192.168.` or `10.0.`
4. Copy this IP address

**Linux:**
1. Open Terminal
2. Type: `ip addr` or `ifconfig`
3. Look for the IP address under your network interface
4. Copy this IP address

**Important:** Note this IP address - you'll need it in the next section!

### Step 6: Start the Backend Server

```bash
python server.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
```

**Keep this terminal window open!** The server must be running for the app to work.

---

## Frontend Setup (Mobile App)

The frontend is a React Native app built with Expo.

### Step 1: Navigate to Project Root
```bash
# If you're in the backend folder, go back to root
cd ..
```

### Step 2: Install Node Dependencies
```bash
npm install
```

This may take a few minutes. Wait for it to complete.

### Step 3: Install Expo CLI (if not already installed)
```bash
npm install -g expo-cli
```

Or use npx (no installation needed):
```bash
npx expo start
```

### Step 4: Configure Backend URL

You need to tell the app where to find your backend server.

**Option A: Using Environment Variable (Recommended)**

Create a `.env` file in the project root:

**Windows:**
```bash
notepad .env
```

**Mac/Linux:**
```bash
nano .env
```

Add this line (replace with YOUR server IP from Step 5):
```env
EXPO_PUBLIC_BACKEND_URL=http://YOUR_SERVER_IP:5000
```

Example:
```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:5000
```

**Option B: Edit Config File Directly**

Open `src/config/backend.ts` and change the IP address:
```typescript
const BACKEND_URL = 
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://YOUR_SERVER_IP:5000';
```

Replace `YOUR_SERVER_IP` with the IP address you found in Backend Step 5.

---

## Running the System

### Step 1: Start the Backend Server

Open a terminal and run:
```bash
cd backend
python server.py
```

Make sure it shows: `Running on http://0.0.0.0:5000`

### Step 2: Start the Frontend App

Open a **new terminal window** (keep the backend server running) and run:

```bash
# From project root
npm start
```

Or:
```bash
npx expo start
```

### Step 3: Run on Your Device

You'll see a QR code in the terminal. Choose one of these options:

**Option A: Run on Physical Device (Recommended)**
1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Make sure your phone is on the **same WiFi network** as your computer
3. Scan the QR code with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app to scan

**Option B: Run on Android Emulator**
```bash
npm run android
```

**Option C: Run on iOS Simulator (Mac only)**
```bash
npm run ios
```

**Option D: Run in Web Browser**
```bash
npm run web
```

---

## Configuration

### Network Connection Types

**Good news:** LinguaJourney works with **any connection type** (LAN cable or WiFi)!

**Requirements:**
- ✅ Both your computer (server) and phone (client) must be on the **same network**
- ✅ The IP address in your config must match your server's current IP
- ✅ If you switch networks, update the IP address in your config

**If you change networks:**
1. Find your new IP address (see Backend Step 5)
2. Update `.env` file or `src/config/backend.ts` with the new IP
3. Restart the Expo app

---

## Troubleshooting

### Problem: "Cannot connect to backend server"

**Solutions:**
1. ✅ Make sure the backend server is running (`python server.py`)
2. ✅ Check that the IP address in your config matches your server's IP
3. ✅ Ensure both devices are on the same network
4. ✅ Check Windows Firewall - it might be blocking port 5000
   - Windows: Go to Windows Defender Firewall → Allow an app → Allow Python
5. ✅ Try pinging the server IP from your phone's network

### Problem: "GEMINI_API_KEY env var is required"

**Solution:**
1. Make sure you created the `.env` file in the `backend` folder
2. Check that the file contains: `GEMINI_API_KEY=your_actual_key`
3. Restart the backend server after creating/editing `.env`

### Problem: "Expo Go can't connect to Metro bundler"

**Solutions:**
1. ✅ Make sure your phone and computer are on the same WiFi network
2. ✅ Try using the "Tunnel" connection type in Expo
3. ✅ Check that port 8081 is not blocked by firewall
4. ✅ Restart Expo: Press `r` in the Expo terminal to reload

### Problem: "OCR/Translation not working"

**Solutions:**
1. ✅ Verify backend server is running and accessible
2. ✅ Check browser/Postman: `http://YOUR_IP:5000/translate` (should return an error, but confirms server is reachable)
3. ✅ Check backend terminal for error messages
4. ✅ Verify GEMINI_API_KEY is correct and has quota remaining

**Android users:** The app works on both Android and iOS. If OCR fails on Android:
- Ensure your phone and the computer running the backend are on the **same Wi‑Fi** (not mobile data).
- Set `EXPO_PUBLIC_BACKEND_URL` (or the URL in `src/config/backend.ts`) to your computer’s LAN IP (e.g. `http://192.168.x.x:5000`), not `localhost`.
- The backend normalizes camera images (including EXIF orientation from Android cameras) before OCR.

### Problem: "IP address keeps changing"

**Solution:**
- Set a static IP address on your computer, OR
- Use your computer's hostname instead of IP (if supported by your network)

### Problem: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**Windows:**
```bash
rmdir /s node_modules
npm install
```

---

## Quick Start Checklist

Before running the app, make sure:

- [ ] Python is installed and working
- [ ] Node.js is installed and working
- [ ] Backend `.env` file created with `GEMINI_API_KEY`
- [ ] Backend server is running (`python server.py`)
- [ ] Frontend `.env` file created with `EXPO_PUBLIC_BACKEND_URL` (or config file updated)
- [ ] Both devices are on the same network
- [ ] IP address is correctly configured
- [ ] Expo Go app is installed on your phone (for physical device testing)

---

## Project Structure

```
LinguaJourney/
├── backend/
│   ├── server.py          # Flask backend server
│   └── .env               # Backend environment variables (create this)
├── src/
│   ├── config/
│   │   └── backend.ts     # Backend URL configuration
│   ├── services/          # API service functions
│   ├── screens/           # App screens
│   └── components/        # Reusable components
├── .env                   # Frontend environment variables (create this)
├── package.json           # Node.js dependencies
└── README.md             # This file
```

---

## Need Help?

If you encounter issues not covered here:

1. Check the error messages in the terminal
2. Verify all prerequisites are installed correctly
3. Make sure all configuration files are set up properly
4. Check that both backend and frontend are running
5. Ensure network connectivity between devices

---

## Summary

**To run LinguaJourney:**

1. **Backend:** `cd backend && python server.py`
2. **Frontend:** `npm start` (in project root)
3. **Connect:** Scan QR code with Expo Go app

That's it! Enjoy using LinguaJourney! 🚀

