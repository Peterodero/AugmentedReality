'use client';

import { useState, useRef, useEffect } from 'react';
import { Compiler } from '@/lib/mindar-image.prod.js';
import {
  Upload, CheckCircle2, AlertCircle, Sparkles, Sliders, Play, Zap, Gamepad2, Plus,
  Trash2, ExternalLink, Link2, RefreshCw, Lock, Unlock, KeyRound, LogOut, Eye, EyeOff, Target
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// Passcode PIN (Can be edited here or set via NEXT_PUBLIC_ADMIN_PIN in .env.local)
const DEFAULT_ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

export default function AdminCompilerClient() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Logo Compiler State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [compiledBuffer, setCompiledBuffer] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Target Logo Management State
  const [targetLogos, setTargetLogos] = useState([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);
  const [targetSuccessMsg, setTargetSuccessMsg] = useState('');
  const [targetErrorMsg, setTargetErrorMsg] = useState('');

  // Game Management State
  const [games, setGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [gameSuccessMsg, setGameSuccessMsg] = useState('');
  const [gameErrorMsg, setGameErrorMsg] = useState('');

  // New Game Form Inputs
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newBadge, setNewBadge] = useState('');

  // Check saved authentication session on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('safaricom_admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchGames();
      fetchTargets();
    }
    setIsCheckingAuth(false);
  }, []);

  // Handle Login Authentication
  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    if (pinInput.trim() === DEFAULT_ADMIN_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('safaricom_admin_authenticated', 'true');
      fetchGames();
      fetchTargets();
    } else {
      setAuthError('Incorrect Password. Try again.');
      setPinInput('');
    }
  };

  // Handle Logout Lock
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('safaricom_admin_authenticated');
    setPinInput('');
    setAuthError('');
  };

  const fetchTargets = async () => {
    setIsLoadingTargets(true);
    try {
      const res = await fetch('/api/upload-target');
      const data = await res.json();
      if (data.targets) {
        setTargetLogos(data.targets);
      }
    } catch (err) {
      console.error('Error fetching targets:', err);
    } finally {
      setIsLoadingTargets(false);
    }
  };

  const handleDeleteTarget = async (target) => {
    if (!target) return;
    setIsDeletingTarget(true);
    setTargetErrorMsg('');
    try {
      const res = await fetch(`/api/upload-target?id=${target.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete target logo.');
      }

      setTargetLogos(data.targets || []);
      setTargetSuccessMsg(`Deleted target logo "${target.name || 'Target'}".`);
      setTimeout(() => setTargetSuccessMsg(''), 4000);
    } catch (err) {
      setTargetErrorMsg(err.message || 'Failed to delete target logo.');
    } finally {
      setIsDeletingTarget(false);
      setTargetToDelete(null);
    }
  };

  const fetchGames = async () => {
    setIsLoadingGames(true);
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (data.games) {
        setGames(data.games);
      }
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setIsLoadingGames(false);
    }
  };

  // Handle Logo File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setCompiledBuffer(null);
    setIsSuccess(false);
    setErrorMessage(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Compile Uploaded Image using MindAR Compiler
  const handleCompile = async () => {
    if (!selectedFile) return;

    setIsCompiling(true);
    setProgress(0);
    setStatusMessage('Reading logo image data...');
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      if (selectedFile.name.endsWith('.mind')) {
        setStatusMessage('Direct .mind file detected. Uploading to active target...');
        const buffer = await selectedFile.arrayBuffer();
        await saveTarget(buffer);
        setIsCompiling(false);
        return;
      }

      const img = new Image();
      img.src = imagePreview;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image file.'));
      });

      setStatusMessage('Extracting AR target feature points...');

      const compiler = new Compiler();
      await compiler.compileImageTargets([img], (prog) => {
        setProgress(Math.round(prog));
        setStatusMessage(`Extracting feature points... ${Math.round(prog)}%`);
      });

      setStatusMessage('Exporting target data buffer...');
      const exportedData = await compiler.exportData();
      setCompiledBuffer(exportedData);

      setStatusMessage('Activating event target on server...');
      await saveTarget(exportedData);

    } catch (err) {
      console.error('Compilation Error:', err);
      setErrorMessage(err.message || 'An error occurred during target compilation.');
    } finally {
      setIsCompiling(false);
    }
  };

  // Save compiled buffer to /api/upload-target
  const saveTarget = async (bufferData) => {
    try {
      const blob = new Blob([bufferData], { type: 'application/octet-stream' });
      const formData = new FormData();
      formData.append('file', blob, 'targets.mind');
      formData.append('fileName', selectedFile ? selectedFile.name : 'Safaricom_Target_Logo.png');
      if (imagePreview) {
        formData.append('previewImage', imagePreview);
      }

      const res = await fetch('/api/upload-target', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save compiled target.');
      }

      setIsSuccess(true);
      setStatusMessage('Target Logo Activated! Ready for AR Scanning.');
      if (data.targets) {
        setTargetLogos(data.targets);
      } else {
        fetchTargets();
      }
    } catch (err) {
      console.error('API Save Error:', err);
      setErrorMessage(err.message || 'Failed to upload target to server.');
    }
  };

  // Add New Game
  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      setGameErrorMsg('Please fill in both Game Title and Game URL.');
      return;
    }

    setIsAddingGame(true);
    setGameErrorMsg('');
    setGameSuccessMsg('');

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          url: newUrl,
          description: newDescription,
          category: newCategory,
          badge: newBadge,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add game.');
      }

      setGames(data.games);
      setGameSuccessMsg(`🎉 Game "${newTitle}" added to active recommendation games!`);
      setNewTitle('');
      setNewUrl('');
      setNewDescription('');
      setNewCategory('');
      setNewBadge('');

      setTimeout(() => setGameSuccessMsg(''), 6000);
    } catch (err) {
      setGameErrorMsg(err.message || 'Failed to add game.');
    } finally {
      setIsAddingGame(false);
    }
  };

  // Delete Game
  const handleDeleteGame = async (id, title) => {
    setDeletingId(id);
    setGameErrorMsg('');
    setGameSuccessMsg('');

    try {
      const res = await fetch(`/api/games?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete game.');
      }

      setGames(data.games);
      setGameSuccessMsg(`Removed "${title}" from games list.`);
      setTimeout(() => setGameSuccessMsg(''), 4000);
    } catch (err) {
      setGameErrorMsg(err.message || 'Failed to delete game.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // PASSCODE LOCK SCREEN UI
  if (!isAuthenticated) {
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-emerald-500/20 shadow-2xl relative">
          <div className="w-16 h-16 rounded-2xl bg-[#00A651]/15 text-[#00A651] border border-[#00A651]/30 flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-heading text-center mb-2">
            Safaricom Event Admin
          </h1>
          <p className="text-xs text-body text-center mb-6 font-medium">
            Enter password to unlock management portal.
          </p>

          {authError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-semibold mb-6 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-extrabold text-heading mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={100}
                  placeholder="Enter Password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-black/50 border border-slate-300 dark:border-white/10 text-heading text-center font-mono text-lg tracking-wider focus:border-[#00A651] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00A651] to-[#008741] text-white font-extrabold text-sm shadow-lg shadow-[#00A651]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Portal</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-[11px] text-sub font-medium">
              Authorized Safaricom Event Personnel Only
            </span>
          </div>
        </div>
      </div>
    );
  }

  // UNLOCKED ADMIN DASHBOARD
  return (
    <div className="page-container min-h-screen p-4 sm:p-6 md:p-12 relative pb-24">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#00A651] opacity-20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-[#00A651] opacity-15 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 border-b border-emerald-500/20 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00A651]/15 border border-[#00A651]/30 text-[#00A651] text-xs font-extrabold">
          <Sparkles className="w-3.5 h-3.5" /> Safaricom Event Admin
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            title="Lock Portal / Logout"
            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* SECTION 1: Event Logo Target Compiler */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 relative">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-heading mb-2 flex items-center gap-3">
              <Sliders className="w-7 h-7 text-[#00A651]" /> 1. Event Logo AR Compiler
            </h1>
            <p className="text-xs sm:text-sm text-body leading-relaxed font-medium">
              Upload any event logo image (Safaricom, M-PESA, partner brand). The system compiles it in your browser and activates it instantly as the live recognition target!
            </p>
          </div>

          {/* Dropzone Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#00A651]/50 hover:border-[#00A651] rounded-2xl p-8 text-center cursor-pointer bg-emerald-50/40 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-white/10 transition-all duration-300 mb-6 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, .mind"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-[#00A651]/20 text-[#00A651] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <p className="font-bold text-heading mb-1">
              {selectedFile ? selectedFile.name : 'Click or Drag Logo Image Here'}
            </p>
            <p className="text-xs text-sub font-medium">
              Supports PNG, JPG, WEBP logo images or direct .mind binary targets
            </p>
          </div>

          {/* Selected Image Preview */}
          {imagePreview && (
            <div className="mb-6 p-4 rounded-2xl glass-panel flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/10 dark:bg-black/60 shrink-0 border border-emerald-500/20 relative">
                <img src={imagePreview} alt="Selected Logo Preview" className="w-full h-full object-contain p-2" />
              </div>
              <div>
                <div className="font-bold text-heading text-sm mb-1">{selectedFile?.name}</div>
                <div className="text-xs text-body font-medium">Ready for feature extraction</div>
                <div className="text-[11px] text-[#00A651] font-semibold mt-1">High contrast logos recommend max accuracy</div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {selectedFile && !isSuccess && (
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00A651] to-[#008741] text-white font-extrabold text-base shadow-xl shadow-[#00A651]/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {isCompiling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compiling Target Logo ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Compile & Activate Event Logo</span>
                </>
              )}
            </button>
          )}

          {/* Compilation Progress Bar */}
          {isCompiling && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-body mb-2 font-semibold">
                <span>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-3 bg-emerald-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00A651] to-[#008741] transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Alert */}
          {isSuccess && (
            <div className="p-5 rounded-2xl bg-[#00A651]/15 border border-[#00A651]/40 text-heading mb-6 animate-in fade-in">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-6 h-6 text-[#00A651] shrink-0" />
                <div className="font-extrabold text-base">New Target Logo Activated!</div>
              </div>
              <p className="text-xs text-body mb-4 leading-relaxed font-medium">
                {statusMessage} All live scanner users will now recognize this new logo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreview(null);
                    setIsSuccess(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#00A651] text-white text-xs font-bold shadow-md hover:bg-[#008741] transition-colors"
                >
                  Upload Another Logo
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-200 text-xs mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-heading mb-1">Compilation Failed</div>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Active Target Logos Management List */}
          <div className="mt-8 border-t border-emerald-500/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00A651]" /> Manage Target Logos ({targetLogos.length})
              </h2>
              <button
                onClick={fetchTargets}
                className="text-xs text-sub hover:text-heading flex items-center gap-1 font-semibold transition-colors"
                title="Refresh target list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTargets ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {targetSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#00A651] text-xs font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{targetSuccessMsg}</span>
              </div>
            )}

            {targetErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-xs font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{targetErrorMsg}</span>
              </div>
            )}

            {isLoadingTargets ? (
              <div className="py-8 text-center text-xs text-sub flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
                <span>Loading active target logos...</span>
              </div>
            ) : targetLogos.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-center text-xs text-sub font-medium">
                No target logos stored. Upload or compile a logo above to enable live AR scanning!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {targetLogos.map((target) => (
                  <div
                    key={target.id}
                    className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3 border border-emerald-500/20 relative group hover:border-[#00A651]/50 transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/10 dark:bg-black/50 shrink-0 border border-emerald-500/20 flex items-center justify-center">
                        {target.preview ? (
                          <img src={target.preview} alt={target.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Sliders className="w-6 h-6 text-[#00A651]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-heading text-xs truncate max-w-[140px]" title={target.name}>
                            {target.name}
                          </span>
                          {target.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#00A651]/20 border border-[#00A651]/40 text-[#00A651] text-[10px] font-extrabold shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-body font-medium flex items-center gap-2">
                          <span>{target.size}</span>
                          <span>•</span>
                          <span>{new Date(target.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setTargetToDelete(target)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-colors shrink-0"
                      title="Delete target logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>


        {/* SECTION 2: Game Recommendations Manager */}
        <section className="glass-panel rounded-3xl p-6 sm:p-8 relative">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-heading mb-2 flex items-center gap-3">
                <Gamepad2 className="w-7 h-7 text-[#00A651]" /> 2. Recommendation Games Manager
              </h2>
              <p className="text-xs sm:text-sm text-body leading-relaxed font-medium">
                Add external game links (Vercel, HTML5 web games) and custom titles. Players will get randomly recommended games from this admin-configured pool upon scanning the logo!
              </p>
            </div>
            <button
              onClick={fetchGames}
              title="Refresh list"
              className="p-2.5 rounded-xl glass-panel text-body hover:text-[#00A651] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Messages for Game Management */}
          {gameSuccessMsg && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00A651] to-[#008741] text-white shadow-xl shadow-[#00A651]/40 border border-emerald-300/40 text-sm mb-6 flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200 font-extrabold">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <span>{gameSuccessMsg}</span>
              </div>
              <button
                onClick={() => setGameSuccessMsg('')}
                className="text-white/80 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
          {gameErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/30 border border-red-400/40 text-sm mb-6 flex items-center justify-between gap-3 animate-in zoom-in-95 duration-200 font-extrabold">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span>{gameErrorMsg}</span>
              </div>
              <button
                onClick={() => setGameErrorMsg('')}
                className="text-white/80 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add New Game Form Card */}
          <form onSubmit={handleAddGame} className="p-5 rounded-2xl glass-panel mb-8 space-y-4">
            <h3 className="text-base font-bold text-heading flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00A651]" /> Add New Game Link & Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-heading mb-1.5">
                  Game Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Safaricom Penalty Shootout 3D"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/60 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-[#00A651] focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading mb-1.5">
                  Game Web URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    required
                    placeholder="https://safaricom-game.vercel.app"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-black/60 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-[#00A651] focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-heading mb-1.5">Category (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sports / Action"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/60 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-[#00A651] focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading mb-1.5">Badge Tag (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hot Prize Game"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/60 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-[#00A651] focus:outline-none transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-heading mb-1.5">Short Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Score penalties to win M-PESA cash!"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-black/60 border-2 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white text-xs font-semibold placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-[#00A651] focus:outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingGame}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00A651] hover:bg-[#008741] text-white font-bold text-xs shadow-lg shadow-[#00A651]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAddingGame ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding Game...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Game to Recommendations Pool</span>
                </>
              )}
            </button>
          </form>

          {/* Current Games List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-heading">
                Active Recommendation Games Pool ({games.length})
              </h3>
              <span className="text-xs text-sub font-medium">Randomly selected on target scan</span>
            </div>

            {isLoadingGames ? (
              <div className="py-8 text-center text-xs text-sub font-medium">Loading games list...</div>
            ) : games.length === 0 ? (
              <div className="py-8 text-center text-xs text-sub glass-panel rounded-2xl font-medium">
                No custom games added yet. Enter a game title and URL above to add your first game recommendation!
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="p-4 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-heading text-sm">{game.title}</span>
                        {game.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-[#00A651]/15 text-[#00A651] border border-[#00A651]/30 text-[10px] font-bold">
                            {game.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-sub flex flex-wrap items-center gap-3">
                        <a
                          href={game.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00A651] hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
                        >
                          <Link2 className="w-3 h-3" />
                          {game.url}
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                        {game.category && (
                          <span className="text-sub">• {game.category}</span>
                        )}
                      </div>

                      {game.description && (
                        <p className="text-[11px] text-body italic">{game.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => setGameToDelete({ id: game.id, title: game.title })}
                      disabled={deletingId === game.id}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors self-end sm:self-auto shrink-0 disabled:opacity-50"
                    >
                      {deletingId === game.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Confirmation Modal Dialog for Game Deletion */}
      {gameToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-modal rounded-3xl p-6 border border-red-500/30 shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-heading mb-2">
              Remove Game Recommendation?
            </h3>

            <p className="text-xs text-body leading-relaxed mb-6 font-medium">
              Are you sure you want to remove <span className="text-heading font-extrabold">"{gameToDelete.title}"</span> from active recommendations? Players scanning the logo will no longer be recommended this game.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setGameToDelete(null)}
                className="flex-1 py-3 rounded-xl glass-panel text-body font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  const target = gameToDelete;
                  setGameToDelete(null);
                  handleDeleteGame(target.id, target.title);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove Game</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Dialog for Target Logo Deletion */}
      {targetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-modal rounded-3xl p-6 border border-red-500/30 shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-heading mb-2">
              Delete Target Logo?
            </h3>

            <p className="text-xs text-body leading-relaxed mb-6 font-medium">
              Are you sure you want to delete <span className="text-heading font-extrabold">"{targetToDelete.name}"</span>?
              {targetToDelete.isActive && ' This is currently the active logo target used by live AR scanners.'}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTargetToDelete(null)}
                disabled={isDeletingTarget}
                className="flex-1 py-3 rounded-xl glass-panel text-body font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeleteTarget(targetToDelete)}
                disabled={isDeletingTarget}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingTarget ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Logo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
