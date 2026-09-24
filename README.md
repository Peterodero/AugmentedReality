# 🚀 Safaricom AR Logo Scan & Game Recommendation Web App

A modern, web-based Augmented Reality (AR) application built with **Next.js (App Router)**, **Tailwind CSS**, **MindAR**, and **Three.js** for Safaricom event activations. 

Players scan a physical Safaricom logo with their smartphone camera, unlock a random game recommendation via WebAR target tracking, and tap **"PLAY NOW"** to get redirected to external Vercel-hosted game websites.

---

## 🌟 Key Features

- 📱 **Web-Based WebAR**: No mobile app installation required. Access directly via browser QR code or short link.
- 🎯 **MindAR Marker Recognition**: Fast client-side image detection locked to the compiled Safaricom logo.
- 🎲 **Random Game Selection**: Picked from a customizable registry (`lib/games.js`) pointing to external Vercel game links.
- 🎨 **Safaricom Branding**: Modern glassmorphism UI, glowing animations, reticle HUD, and confetti particle celebration (`#00A651` Safaricom Green).
- 🔒 **Zero Login System**: Seamless user experience for high-volume live event crowds.

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **AR Engine**: `mind-ar` (Image Target tracking with WebGL/WASM)
- **3D Graphics**: `three`
- **Icons & Effects**: `lucide-react`, `canvas-confetti`

---

## 📋 Step-by-Step Setup & Logo Compilation

### Step 1: Compile Your Event Logo (`targets.mind`) — Two Options

#### ✅ Option A: Use the Built-in Admin Compiler Page (Recommended)
1. Run your app locally (`npm run dev`) or open your deployed Vercel URL.
2. Navigate to:  
   `http://localhost:3000/admin` (dev) or `https://your-domain.vercel.app/admin` (production)
3. Click **"Click or Drag Logo Image Here"** and upload your event logo (PNG, JPG, or WEBP).
4. Click **"Compile & Activate Event Logo"**.
5. The browser compiles the logo and saves it as `public/targets.mind` automatically. Done!

> 💡 **This works for ANY brand!** Safaricom, M-PESA, Airtel, or any future event partner. Just upload a new logo at `/admin` before each event.

#### Option B: Use the External MindAR Compiler Tool (Manual)
1. Open: [https://hiukim.github.io/mind-ar-js-doc/tools/compile](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
2. Upload logo image → Click **Start** → Download `targets.mind`
3. Replace `public/targets.mind` in your project manually.

---

### Step 2: Configure Your Vercel Game Links

Open [`lib/games.js`](file:///home/rockstar/dev/MindMill/AR/lib/games.js) to update your list of recommended Vercel-hosted games:

```javascript
export const GAMES = [
  {
    id: 'safaricom-runner',
    title: 'Safaricom Safari Runner 3D',
    description: 'Dodge obstacles, collect M-PESA coins, and race for high score!',
    category: 'Arcade / Action',
    badge: 'Popular',
    url: 'https://your-game-1.vercel.app', // <--- Replace with your Vercel game URL
  },
  // Add more games as needed...
];
```

---

### Step 3: Local Development

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ **Camera Access Note**: Smartphone web browsers (iOS Safari, Chrome for Android) strictly require an **HTTPS** connection to grant camera access. 
> - When deployed on **Vercel**, HTTPS is automatically enabled for free.
> - For local phone testing over Wi-Fi, you can use `ngrok http 3000` or local HTTPS flags.

---

### Step 4: Deployment to Vercel

Deploying to Vercel takes less than a minute:

1. Push your code repository to **GitHub**.
2. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
3. Select your repository and click **Deploy**.
4. Test the live HTTPS URL on your mobile phone!

---

## 📁 Project Structure

```
AR/
├── app/
│   ├── globals.css         # Safaricom green design system & AR reticle styling
│   ├── layout.js           # Root layout & AR mobile viewports
│   ├── page.js             # Event Landing Page & scanning instructions
│   └── scan/
│       ├── page.js         # AR Scanner route wrapper
│       └── ScanClient.js   # MindAR + Three.js client component & game modal
├── lib/
│   └── games.js            # External Vercel games catalog & randomizer
├── public/
│   └── targets.mind        # MindAR compiled logo target file
└── README.md
```
