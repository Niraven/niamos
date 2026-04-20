import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { storage } from "./lib/storage";
import type { Tab } from "./lib/api";
import { TABS, BottomNav, NAV_CLEARANCE } from "./components/Nav";
import { TopBar } from "./components/TopBar";
import { Setup } from "./modules/Setup";
import { Home } from "./modules/Home";
import { Chat } from "./modules/Chat";
import { Capture } from "./modules/Capture";
import { Agents } from "./modules/Agents";
import { Memory } from "./modules/Memory";
import { Files } from "./modules/Files";

export default function App() {
  const [setupDone, setSetupDone] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");

  useEffect(() => {
    if (storage.get("setup_done", false)) setSetupDone(true);
  }, []);

  const handleSetup = () => {
    storage.set("setup_done", true);
    setSetupDone(true);
  };

  if (!setupDone) return <Setup onSetup={handleSetup} />;

  const title = TABS.find(t => t.id === activeTab)?.label || "NiamOS";

  return (
    <div className="flex flex-col h-screen safe-top" style={{ background: "var(--bg)" }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface-2)",
            border: "1px solid var(--border-s)",
            color: "var(--text-1)",
            fontSize: "12px",
            borderRadius: "12px",
          },
        }}
      />
      <TopBar title={title} />
      <main className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: NAV_CLEARANCE }}>
        <div className="tab-content h-full">
          {activeTab === "home"    && <Home setTab={setActiveTab} />}
          {activeTab === "chat"    && <Chat />}
          {activeTab === "capture" && <Capture />}
          {activeTab === "agents"  && <Agents />}
          {activeTab === "memory"  && <Memory />}
          {activeTab === "files"   && <Files />}
        </div>
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
