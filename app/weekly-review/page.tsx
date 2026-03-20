/**
 * 📍 WhisperDesk Page: Weekly Review
 * 🗂 Route: /weekly-review
 * 🧭 Purpose: Capture weekly reflections and track progress over time
 */

"use client";

import { useEffect, useState } from "react";
import WhisperLayout from "@/app/components/whisper-layout";
import { supabase } from "@/lib/supabase";

type WeeklyReview = {
  id: string;
  wins: string | null;
  challenges: string | null;
  next_focus: string | null;
  energy: number | null;
  created_at: string;
};

export default function WeeklyReviewPage() {
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReviews = async () => {
    setLoadingReviews(true);

    try {
      const { data, error } = await supabase
        .from("weekly_reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading reviews:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        setErrorMessage(error.message || "Could not load weekly reviews.");
        return;
      }

      setReviews((data as WeeklyReview[]) || []);
    } catch (err) {
      console.error("Unexpected error loading reviews:", err);
      setErrorMessage("Something unexpected went wrong while loading reviews.");
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setErrorMessage("");

    try {
      const payload = {
        wins: wins.trim() || null,
        challenges: challenges.trim() || null,
        next_focus: nextFocus.trim() || null,
        energy,
      };

      const { data, error } = await supabase
        .from("weekly_reviews")
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase insert error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        setErrorMessage(error.message || "Could not save weekly review.");
        return;
      }

      const inserted = (data as WeeklyReview[]) || [];

      setReviews((prev) => [...inserted, ...prev]);
      setSaved(true);

      setWins("");
      setChallenges("");
      setNextFocus("");
      setEnergy(null);
      setShowForm(false);
    } catch (err) {
      console.error("Unexpected error saving review:", err);
      setErrorMessage("Something unexpected went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  return (
    <WhisperLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl text-white md:text-4xl">Weekly Review</h1>
            <p className="mt-2 text-white/70">
              A gentle record of your wins, challenges, and where you want to
              head next.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl text-white">This Week’s Check-In</h2>
              <p className="mt-1 text-sm text-white/60">
                Keep it simple. Small truths count.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm((prev) => !prev);
                setSaved(false);
                setErrorMessage("");
              }}
              className="inline-flex items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/15 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-400/25"
            >
              {showForm ? "Hide review form ↑" : "New weekly review ↓"}
            </button>
          </div>

          {saved ? (
            <p className="mt-4 text-sm text-violet-300">
              ✨ Saved. Your progression is being recorded.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-4 text-sm text-rose-300">{errorMessage}</p>
          ) : null}

          {showForm ? (
            <div className="mt-5 space-y-5 rounded-2xl border border-white/10 bg-black/10 p-5">
              <div>
                <label className="text-sm text-white/85">
                  ✨ Wins this week
                </label>
                <textarea
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="What went well, even in small ways?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/40"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm text-white/85">🌧️ Challenges</label>
                <textarea
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="What felt hard or draining?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/40"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm text-white/85">
                  🔮 Focus for next week
                </label>
                <textarea
                  value={nextFocus}
                  onChange={(e) => setNextFocus(e.target.value)}
                  placeholder="What matters most next week?"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/40"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm text-white/85">⚡ Energy level</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const selected = energy === n;

                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEnergy(n)}
                        className={`h-10 w-10 rounded-full border text-sm transition ${
                          selected
                            ? "border-violet-400 bg-violet-400/20 text-violet-200"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/30 hover:text-white"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/15 px-4 py-3 text-white transition hover:bg-violet-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save weekly review"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5">
              <p className="text-sm text-white/60">
                Start a new review when you’re ready. Your past entries will
                stay just below.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-5">
            <h2 className="text-xl text-white">Past Reviews</h2>
            <p className="mt-1 text-sm text-white/60">
              A little trail of breadcrumbs showing how far you’ve come.
            </p>
          </div>

          {loadingReviews ? (
            <p className="text-white/60">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-white">No reviews saved yet.</p>
              <p className="mt-1 text-sm text-white/60">
                Your first one will appear here once you save it.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg text-white">
                        Week of {formatDate(review.created_at)}
                      </h3>
                      <p className="mt-1 text-sm text-white/50">
                        Saved on {formatDate(review.created_at)}
                      </p>
                    </div>

                    <div className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-sm text-violet-200">
                      Energy: {review.energy ?? "—"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Wins
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                        {review.wins || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Challenges
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                        {review.challenges || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Next Focus
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                        {review.next_focus || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WhisperLayout>
  );
}
