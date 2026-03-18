/**
 * Backend Configuration
 * 
 * This file centralizes the backend server URL configuration.
 * 
 * IMPORTANT: The connection type (LAN cable or WiFi) doesn't matter as long as:
 * 1. Both the server machine and client device are on the same network
 * 2. The server machine's IP address is correctly set here
 * 3. The server is running and accessible
 * 
 * To configure:
 * - Set EXPO_PUBLIC_BACKEND_URL environment variable, OR
 * - Update the fallback IP address below to match your server's IP
 * 
 * To find your server's IP address:
 * - Windows: ipconfig (look for IPv4 Address)
 * - Mac/Linux: ifconfig or ip addr (look for inet address)
 * - The IP should match the network you're connected to (LAN or WiFi)
 */

// Same PC: use localhost. Phone/other device: set EXPO_PUBLIC_BACKEND_URL in root .env to this PC's IP (e.g. http://192.168.1.100:5000)
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

export const BACKEND_CONFIG = {
  BASE_URL: BACKEND_URL,
  // Timeout for translate/other API requests (30 seconds)
  TIMEOUT_MS: 30000,
  // OCR uses image + Gemini vision and can be slow; use longer timeout (90 seconds)
  OCR_TIMEOUT_MS: 90000,
} as const;



