import { useEffect, useState } from "react";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md bg-white/95 backdrop-blur border-2 border-primary/20 rounded-3xl shadow-lg p-4 flex items-center justify-between gap-3">
      <div>
        <p className="font-black text-foreground">Install Ottiya Korean</p>
        <p className="text-sm text-muted-foreground">Open it like an app on your home screen.</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-primary text-white font-black px-4 py-2 rounded-full shadow-sm"
      >
        Install
      </button>
    </div>
  );
}
