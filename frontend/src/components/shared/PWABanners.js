'use client';

import { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import Image from 'next/image';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    return ts ? Date.now() - Number(ts) < DISMISS_TTL : false;
  } catch {
    return false;
  }
}

export default function PWABanners() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // ── Install prompt ────────────────────────────────────────────────────────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // suppress browser mini-infobar
      if (wasDismissedRecently()) return;
      setInstallPrompt(e);
      setShowInstall(true);
    };
    const handleAppInstalled = () => {
      setShowInstall(false);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // ── SW update detection ──────────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // A waiting worker already exists (user navigated after update was found)
        if (reg.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(reg.waiting);
          setShowUpdate(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            // 'installed' + an existing controller = new version waiting, not first install
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    installPrompt.prompt();
    await installPrompt.userChoice;
    setShowInstall(false);
    setInstallPrompt(null);
    setInstalling(false);
  };

  const dismissInstall = () => {
    setShowInstall(false);
    setInstallPrompt(null);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const handleUpdate = () => {
    if (!waitingWorker) return;
    // Trigger skipWaiting() in the waiting SW. The controllerchange listener
    // in layout.js then reloads the page so the new bundles are used.
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdate(false);
  };

  // Update takes priority — hide install banner while an update is pending
  const showInstallBanner = showInstall && !showUpdate;

  return (
    <>
      {/* ── Update bar (bottom, full-width) ──────────────────────────────── */}
      {showUpdate && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 bg-[#0A1B3D] px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw size={15} className="shrink-0 text-[#93C5FD]" />
            <span className="text-sm font-medium text-white truncate">
              A new version is available
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUpdate}
              className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 px-3 py-1.5 text-xs font-semibold text-white transition-all"
            >
              Update Now
            </button>
            <button
              onClick={() => setShowUpdate(false)}
              aria-label="Dismiss update notification"
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Install card (bottom, centered) ──────────────────────────────── */}
      {showInstallBanner && (
        <div
          role="complementary"
          aria-label="Install TransHub app"
          className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-sm rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
        >
          <button
            onClick={dismissInstall}
            aria-label="Dismiss install prompt"
            className="absolute right-3 top-3 rounded-lg p-1 text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <X size={15} />
          </button>

          <div className="flex items-start gap-3 pr-4">
            <Image
              src="/icons/icon-96x96.png"
              alt="TransHub"
              width={44}
              height={44}
              className="rounded-xl shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F172A]">Install TransHub</p>
              <p className="mt-0.5 text-xs leading-snug text-[#64748B]">
                Book seats, send goods &amp; access your tickets offline — right from your home screen.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-60"
          >
            <Download size={15} />
            {installing ? 'Opening prompt…' : 'Install App'}
          </button>
        </div>
      )}
    </>
  );
}
