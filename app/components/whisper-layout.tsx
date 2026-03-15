"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Image from "next/image";

type WhisperLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Business Setup", href: "/business-setup" },
  { label: "Weekly Review", href: "/weekly-review" },
  { label: "Admin Vault", href: "/admin-vault" },
];

export default function WhisperLayout({ children }: WhisperLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(91,70,255,0.12),transparent_30%),linear-gradient(180deg,#030712_0%,#020617_100%)] text-white">
      <div className="flex min-h-screen">
        <aside className="w-80 border-r border-white/10 bg-white/3 backdrop-blur-xl">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,rgba(124,58,237,0.35),rgba(59,130,246,0.18))] shadow-[0_10px_30px_rgba(76,29,149,0.25)]">
                  <Image
                    src="/logo/whispercode-icon.png"
                    alt="WhisperCode"
                    width={32}
                    height={32}
                    className="h-auto w-auto object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-4xl font-semibold text-white">
                    WhisperDesk
                  </h1>
                  <p className="mt-1 text-sm text-white/70">
                    Founder Command Centre
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-5">
              <ul className="space-y-3">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-2xl px-5 py-4 text-2xl transition ${
                          isActive
                            ? "bg-violet-500/25 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="px-5 pb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/30 text-lg text-white/90">
                N
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-10">
          <div className="mx-auto max-w-310 rounded-4xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,24,40,0.82),rgba(7,11,26,0.92))] p-10 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
