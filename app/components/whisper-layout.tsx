import Image from "next/image";

type WhisperLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  "Dashboard",
  "Business Setup",
  "Squirrel List",
  "Content Planner",
  "Admin Vault",
  "Weekly Review",
];

export default function WhisperLayout({ children }: WhisperLayoutProps) {
  return (
    <div className="flex min-h-screen bg-(--whisper-bg) text-white">
      <aside className="w-72 border-r border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(124,58,237,0.2)]">
              <Image
                src="/logo/whispercode-icon.png"
                alt="WhisperCode"
                width={24}
                height={24}
              />
            </div>

            <div>
              <h1 className="text-xl tracking-wide">WhisperDesk</h1>
              <p className="text-xs text-(--whisper-muted)">
                Founder Command Centre
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={item}>
                <button
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                    index === 0
                      ? "bg-(--whisper-primary)/20 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]"
                      : "text-(--whisper-muted) hover:bg-[rgba(124,58,237,0.12)] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
          {children}
        </div>
      </main>
    </div>
  );
}
