import Link from 'next/link';
import { Camera, Gamepad2, Sparkles, Sun, Zap, ArrowRight, Smartphone } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function LandingPage() {
  return (
    <main className="page-container min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-12 relative overflow-hidden">
      {/* Dynamic Glowing Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#00A651] opacity-20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-[#00A651] opacity-15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-emerald-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A651] to-[#008741] flex items-center justify-center shadow-lg shadow-[#00A651]/30 font-bold text-xl text-white">
            S
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-heading flex items-center gap-2">
              Safaricom <span className="text-[#00A651]">AR Zone</span>
            </h1>
            <p className="text-xs text-sub font-medium">Live Event Recognition Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A651]/15 border border-[#00A651]/30 text-[#00A651] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00A651] animate-ping" />
            AR Camera Ready
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="max-w-3xl mx-auto w-full my-auto py-8 text-center relative z-10 flex flex-col items-center">
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-bold text-[#00A651] mb-6 float-item">
          <Sparkles className="w-4 h-4 text-[#00A651]" />
          Instant WebAR Recognition & Games
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-heading leading-tight mb-4">
          Point Your Camera at the <br />
          <span className="text-[#00A651]">
            Safaricom Event Logo
          </span>
        </h2>

        <p className="text-base sm:text-lg text-body max-w-xl mb-8 leading-relaxed font-medium">
          Welcome to the Safaricom Event Gaming Portal. Point your camera at any official Safaricom booth logo to instantly unlock curated web game recommendations.
        </p>

        {/* Big Interactive Scan Button */}
        <Link
          href="/scan"
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00A651] to-[#008741] text-white font-extrabold text-lg shadow-xl shadow-[#00A651]/30 hover:shadow-[#00A651]/60 hover:scale-[1.02] transition-all duration-300 border border-emerald-400/30 active:scale-95"
        >
          <Camera className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          <span>Launch AR Scanner</span>
          <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* How It Works Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-12 text-left">
          <div className="glass-panel p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#00A651]/15 text-[#00A651] flex items-center justify-center font-extrabold mb-3">
              1
            </div>
            <h3 className="font-extrabold text-heading mb-1 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00A651]" /> Scan Logo
            </h3>
            <p className="text-xs text-body leading-normal font-medium">
              Allow camera permission and align the physical Safaricom logo inside the AR targeting reticle.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#00A651]/15 text-[#00A651] flex items-center justify-center font-extrabold mb-3">
              2
            </div>
            <h3 className="font-extrabold text-heading mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00A651]" /> Instant Lock
            </h3>
            <p className="text-xs text-body leading-normal font-medium">
              MindAR extracts feature vectors in real-time and recommends an admin-curated event game.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#00A651]/15 text-[#00A651] flex items-center justify-center font-extrabold mb-3">
              3
            </div>
            <h3 className="font-extrabold text-heading mb-1 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-[#00A651]" /> Play & Win
            </h3>
            <p className="text-xs text-body leading-normal font-medium">
              Tap "Play Now" to launch straight into your recommended game website. No app download required!
            </p>
          </div>
        </div>

        {/* Event Lighting Tip Banner */}
        <div className="mt-8 p-4 rounded-xl glass-panel max-w-xl w-full flex items-start gap-3 text-left">
          <Sun className="w-5 h-5 text-[#00A651] shrink-0 mt-0.5" />
          <div className="text-xs text-body font-medium">
            <span className="font-extrabold text-heading">Event Tip:</span> Ensure good lighting on the logo and keep your device steady. If reflection occurs, tilt phone slightly for fast lock.
          </div>
        </div>
      </div>
    </main>
  );
}
