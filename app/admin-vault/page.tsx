/**
 * 📍 WhisperDesk Page: Admin Vault
 * 🗂 Route: /admin-vault
 * 🧭 Purpose: Quick access to key tools, links, and business resources
 */

"use client";

import WhisperLayout from "@/app/components/whisper-layout";

export default function AdminVaultPage() {
  const links = [
    {
      label: "Google Drive Vault",
      description: "All documents, contracts, and important files.",
      href: "https://drive.google.com/drive/u/1/folders/1_TqX0g0KRuBhwYIhwDU7sPbqN6wFxXje", // ← replace with your folder link
    },
    {
      label: "Banking",
      description: "Business account and finances.",
      href: "#",
    },
    {
      label: "Invoices / Payments",
      description: "Track income and outgoing payments.",
      href: "#",
    },
    {
      label: "Analytics",
      description: "Website and product performance.",
      href: "#",
    },
  ];

  return (
    <WhisperLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl text-white md:text-4xl">Admin Vault</h1>
          <p className="mt-2 text-white/70">
            Your quiet little control room. Everything important, in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
            >
              <div>
                <h2 className="text-xl text-white group-hover:text-violet-200">
                  {link.label}
                </h2>
                <p className="mt-2 text-sm text-white/60">{link.description}</p>
              </div>

              <div className="mt-4 text-sm text-violet-300">Open →</div>
            </a>
          ))}
        </div>
      </div>
    </WhisperLayout>
  );
}
