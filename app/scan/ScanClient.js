'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { MindARThree } from '@/lib/mindar-image-three.prod.js';
import { fetchGames, getRandomGame } from '@/lib/games';
import { Camera, ArrowLeft, ExternalLink, Sparkles, Sun, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import ThemeToggle from '@/components/ThemeToggle';

export default function ScanClient() {
  const containerRef = useRef(null);
  const [arLoaded, setArLoaded] = useState(false);
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [gamesPool, setGamesPool] = useState([]);
  const [recommendedGame, setRecommendedGame] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [scanCount, setScanCount] = useState(0);
  const mindarThreeRef = useRef(null);

  // Fetch games list from admin storage on mount
  useEffect(() => {
    async function loadGames() {
      const list = await fetchGames();
      setGamesPool(list);
    }
    loadGames();
  }, []);

  useEffect(() => {
    let mindarThree = null;

    async function initAR() {
      try {
        if (!containerRef.current) return;

        // Initialize MindARThree instance pointing to compiled logo target
        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/targets.mind',
          maxTrack: 1,
          uiScanning: 'no',
          uiLoading: 'no',
        });

        mindarThreeRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Add 3D anchor target listener
        const anchor = mindarThree.addAnchor(0);

        // 3D visual ring anchored directly to physical logo in 3D space
        const geometry = new THREE.RingGeometry(0.5, 0.6, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00A651, side: THREE.DoubleSide });
        const ringPlane = new THREE.Mesh(geometry, material);
        anchor.group.add(ringPlane);

        // Logo Target Found Event Handler
        anchor.onTargetFound = () => {
          setIsTargetFound(true);

          // Select random game recommendation from loaded games pool
          setGamesPool(currentPool => {
            if (currentPool && currentPool.length > 0) {
              const game = getRandomGame(currentPool);
              setRecommendedGame(game);
              // Celebrate with high-energy Safaricom green confetti burst!
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#00A651', '#FFD100', '#008741', '#FFFFFF'],
              });
            } else {
              setRecommendedGame(null);
            }
            return currentPool;
          });

          setScanCount(prev => prev + 1);
        };

        anchor.onTargetLost = () => {
          // Keep recommendation visible so player can interact with the popup
        };

        // Start WebAR engine & camera stream
        await mindarThree.start();

        // Render Loop
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });

        setArLoaded(true);
      } catch (err) {
        console.error('AR Initialization error:', err);
        setErrorMessage(
          err.message || 'Camera access denied or WebGL unavailable. Please check permissions.'
        );
      }
    }

    initAR();

    // Cleanup on unmount
    return () => {
      if (mindarThreeRef.current) {
        try {
          mindarThreeRef.current.stop();
        } catch (e) {
          console.warn('MindAR cleanup:', e);
        }
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#07120C] text-white overflow-hidden select-none">
      {/* MindAR Camera Canvas Container */}
      <div ref={containerRef} id="mindar-container" />

      {/* Top Floating HUD Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-panel text-xs font-semibold text-gray-200 hover:text-white active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 text-[#00A651]" /> Back
        </Link>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-bold text-[#00A651]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00A651] animate-ping" />
            Safaricom AR Scan
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Loading Overlay */}
      {!arLoaded && !errorMessage && (
        <div className="fixed inset-0 z-40 bg-[#07120C] flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#00A651]/20 border-t-[#00A651] animate-spin" />
            <Camera className="w-8 h-8 text-[#00A651]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Starting AR Camera...</h2>
          <p className="text-xs text-gray-400 max-w-xs">
            Please allow camera permissions if prompted by your browser.
          </p>
        </div>
      )}

      {/* Error Message Overlay */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 bg-[#07120C]/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Camera Access Error</h2>
          <p className="text-xs text-gray-300 max-w-sm mb-6 relaxed leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#00A651] text-white font-bold text-sm shadow-lg shadow-[#00A651]/30 hover:bg-[#008741] transition-colors"
          >
            Retry Camera Access
          </button>
        </div>
      )}

      {/* AR Reticle / Targeting Frame (Visible while waiting for logo match) */}
      {arLoaded && !isTargetFound && (
        <div className="fixed inset-0 z-20 pointer-events-none flex flex-col items-center justify-center p-6">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl border-2 border-dashed border-[#00A651]/70 ar-reticle flex items-center justify-center">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#00A651] rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#00A651] rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#00A651] rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#00A651] rounded-br-xl" />

            {/* Laser Scan Line */}
            <div className="animate-scan" />

            <div className="text-center px-4 py-2 rounded-xl glass-panel text-xs font-semibold text-heading shadow-md">
              Align Safaricom Logo inside reticle
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs text-body font-semibold">
            <Sun className="w-4 h-4 text-[#00A651]" />
            Keep logo well-lit & glare-free
          </div>
        </div>
      )}

      {/* Target Found Modal Card Overlay */}
      {isTargetFound && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-modal rounded-3xl p-6 relative overflow-hidden border border-[#00A651]/50 shadow-2xl">
            {/* Decorative Top Glow Header */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00A651] opacity-30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#00A651] opacity-15 rounded-full blur-2xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00A651]/15 border border-[#00A651]/30 text-xs font-extrabold text-[#00A651] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Logo Recognized!
              </span>
            </div>

            {recommendedGame ? (
              <>
                {/* Game Recommendation Details */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-heading leading-tight mb-2">
                    {recommendedGame.title}
                  </h3>
                  <p className="text-sm text-body leading-relaxed font-medium">
                    {recommendedGame.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <a
                    href={recommendedGame.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00A651] to-[#008741] text-white font-extrabold text-center text-base shadow-xl shadow-[#00A651]/30 hover:shadow-[#00A651]/60 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/30"
                  >
                    <span>PLAY NOW</span>
                    <ExternalLink className="w-5 h-5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      className="flex-1 py-3 rounded-xl glass-panel text-xs font-bold text-heading hover:text-[#00A651] transition-colors flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#00A651]" /> Back to Home
                    </Link>

                    <button
                      onClick={() => setIsTargetFound(false)}
                      aria-label="Scan logo again"
                      className="py-3 px-4 rounded-xl glass-panel text-xs font-bold text-heading hover:text-[#00A651] transition-colors active:scale-95"
                    >
                      Rescan Logo
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* No Games Configured Message */}
                <div className="mb-6 text-center py-4">
                  <div className="text-4xl mb-3">🎮</div>
                  <h3 className="text-xl font-black text-heading leading-tight mb-2">
                    Logo Scanned!
                  </h3>
                  <p className="text-sm text-body leading-relaxed font-medium">
                    No games have been configured yet. Ask the event admin to add game recommendations at the admin portal.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/"
                    className="flex-1 py-3 rounded-xl glass-panel text-xs font-bold text-heading hover:text-[#00A651] transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#00A651]" /> Back to Home
                  </Link>
                  <button
                    onClick={() => setIsTargetFound(false)}
                    className="py-3 px-4 rounded-xl glass-panel text-xs font-bold text-heading hover:text-[#00A651] transition-colors active:scale-95"
                  >
                    Rescan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
