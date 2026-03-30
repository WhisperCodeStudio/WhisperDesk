/**
 * 📍 WhisperDesk Page: Admin Vault
 * 🗂 Route: /admin-vault
 * 🧭 Purpose: Quick access to key tools, links, and business resources
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import WhisperLayout from "@/app/components/whisper-layout";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const SETTINGS_KEY = "guiding_principles";

type VaultSettingRow = {
  key: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export default function AdminVaultPage() {
  const supabase = useMemo(() => {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, []);

  const links = [
    {
      label: "Google Drive Vault",
      description: "All documents, contracts, and important files.",
      href: "https://drive.google.com/drive/u/1/folders/1_TqX0g0KRuBhwYIhwDU7sPbqN6wFxXje",
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

  const [principles, setPrinciples] = useState("");
  const [loadingPrinciples, setLoadingPrinciples] = useState(true);
  const [savingPrinciples, setSavingPrinciples] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function loadPrinciples() {
      try {
        setLoadingPrinciples(true);
        setStatusMessage(null);
        setStatusType(null);

        console.log("SUPABASE URL:", SUPABASE_URL);
        console.log("Loading from table: public.admin_vault_settings");
        console.log("Loading key:", SETTINGS_KEY);

        const { data, error } = await supabase
          .from("admin_vault_settings")
          .select("key, content, created_at, updated_at")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();

        console.log("LOAD RESULT:", { data, error });

        if (error) {
          throw error;
        }

        if (!active) return;

        const row = data as VaultSettingRow | null;
        setPrinciples(row?.content ?? "");
      } catch (error) {
        console.error("Error loading guiding principles:", error);
        if (!active) return;
        setStatusMessage("Couldn’t load your guiding principles just now.");
        setStatusType("error");
      } finally {
        if (active) {
          setLoadingPrinciples(false);
        }
      }
    }

    void loadPrinciples();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSavePrinciples() {
    try {
      setSavingPrinciples(true);
      setStatusMessage(null);
      setStatusType(null);

      const cleaned = principles.trim();

      console.log("Saving to table: public.admin_vault_settings");
      console.log("Saving key:", SETTINGS_KEY);
      console.log("Saving content:", cleaned);

      const result = await supabase
        .from("admin_vault_settings")
        .upsert(
          {
            key: SETTINGS_KEY,
            content: cleaned,
          },
          {
            onConflict: "key",
          },
        )
        .select();

      console.log("SAVE RESULT:", result);

      if (result.error) {
        throw result.error;
      }

      const savedRow = result.data?.[0] as VaultSettingRow | undefined;
      if (savedRow) {
        setPrinciples(savedRow.content ?? cleaned);
      } else {
        setPrinciples(cleaned);
      }

      setStatusMessage("Guiding principles saved.");
      setStatusType("success");
    } catch (error) {
      console.error("Error saving guiding principles:", error);
      setStatusMessage("Couldn’t save right now. Try again in a moment.");
      setStatusType("error");
    } finally {
      setSavingPrinciples(false);
    }
  }

  return (
    <WhisperLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl text-white md:text-4xl">Admin Vault</h1>
          <p className="mt-2 text-white/70">
            Your quiet little control room. Everything important, in one place.
          </p>
        </div>

        <section className="rounded-2xl border border-violet-400/20 bg-white/[0.04] p-5 shadow-[0_0_30px_rgba(124,58,237,0.08)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl text-white md:text-2xl">
                Guiding Principles
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                A small space for the quiet truths you want nearby while you
                build. Values, reminders, filters, soft rules. Whatever helps
                you steer the ship without making your brain work harder.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200/80">
              Founder only
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="guiding-principles"
              className="mb-2 block text-sm text-white/75"
            >
              Your note
            </label>

            <textarea
              id="guiding-principles"
              value={principles}
              onChange={(e) => setPrinciples(e.target.value)}
              placeholder={`Examples:
🌿 Does this feel kind to use?
✨ Does this create a feeling?
🕯 Will this burn me out?
💎 Am I proud to ship this?`}
              rows={8}
              disabled={loadingPrinciples}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/35 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/45">
                Keep this light. It’s a compass, not another task list.
              </p>

              <button
                type="button"
                onClick={handleSavePrinciples}
                disabled={loadingPrinciples || savingPrinciples}
                className="inline-flex items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPrinciples
                  ? "Loading..."
                  : savingPrinciples
                    ? "Saving..."
                    : "Save principles"}
              </button>
            </div>

            {statusMessage ? (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  statusType === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                }`}
              >
                {statusMessage}
              </div>
            ) : null}
          </div>
        </section>

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
