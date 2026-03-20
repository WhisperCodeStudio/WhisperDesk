/**
 * 📍 WhisperDesk Page: Roadmap
 * 🗂 Route: /roadmap
 * 🧭 Purpose: Guided step-by-step workflow through business stages
 */

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WhisperLayout from "@/app/components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/app/data/master-tasks";

type Stage =
  | "foundation"
  | "infrastructure"
  | "presence"
  | "growth"
  | "product"
  | "rhythm";

type RoadmapTask = Task & {
  stage?: Stage | null;
  stage_order?: number | null;
  flow_order?: number | null;
  depends_on_title?: string | null;
};

type StageMeta = {
  key: Stage;
  label: string;
  description: string;
};

type StageSummary = StageMeta & {
  total: number;
  completed: number;
  percent: number;
};

const STAGES: StageMeta[] = [
  {
    key: "foundation",
    label: "Foundation",
    description: "Core business direction, offers, and structure.",
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    description: "Systems, admin, and delivery support.",
  },
  {
    key: "presence",
    label: "Brand & Presence",
    description: "Brand, website, and portfolio visibility.",
  },
  {
    key: "growth",
    label: "Growth",
    description: "Marketing, lead flow, and launch momentum.",
  },
  {
    key: "product",
    label: "Product",
    description: "Studio tools and product-building work.",
  },
  {
    key: "rhythm",
    label: "Founder Rhythm",
    description: "Founder routines and sustainable cadence.",
  },
];

export default function RoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .in(
            "stage",
            STAGES.map((stage) => stage.key),
          )
          .order("stage_order", { ascending: true })
          .order("flow_order", { ascending: true })
          .order("title", { ascending: true });

        if (error) {
          console.error("Error loading roadmap tasks:", error);
          return;
        }

        setTasks((data as RoadmapTask[]) || []);
      } catch (err) {
        console.error("Unexpected error loading roadmap tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const overallStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }, [tasks]);

  const stageSummaries = useMemo<StageSummary[]>(() => {
    return STAGES.map((stage) => {
      const stageTasks = tasks.filter((task) => task.stage === stage.key);
      const total = stageTasks.length;
      const completed = stageTasks.filter((task) => task.completed).length;
      const percent = total ? Math.round((completed / total) * 100) : 0;

      return {
        ...stage,
        total,
        completed,
        percent,
      };
    });
  }, [tasks]);

  const currentStage = useMemo(() => {
    return (
      stageSummaries.find(
        (stage) => stage.total > 0 && stage.completed < stage.total,
      ) ??
      stageSummaries.find((stage) => stage.total > 0) ??
      null
    );
  }, [stageSummaries]);

  return (
    <WhisperLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl text-white md:text-4xl">Roadmap</h1>
            <p className="mt-2 text-white/70">
              Your bigger-picture founder journey, one calm stage at a time.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-violet-200"
          >
            ← Back to dashboard
          </Link>
        </div>

        <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200/90">
                Founder roadmap
              </span>

              <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                Build WhisperCode with clarity, not chaos
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/70 md:text-base">
                This page is your stage overview. Open any stage to focus on its
                tasks without the dashboard repeating itself like a cursed twin.
              </p>
            </div>

            <div className="min-w-55 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                Current stage
              </p>
              <p className="mt-2 text-lg font-medium text-white">
                {currentStage?.label ?? "No stage yet"}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {currentStage
                  ? `${currentStage.completed} of ${currentStage.total} complete`
                  : "Add roadmap tasks to begin"}
              </p>

              {currentStage ? (
                <Link
                  href={`/roadmap/${currentStage.key}`}
                  className="mt-4 inline-flex rounded-xl border border-violet-400/30 bg-violet-400/15 px-4 py-2 text-sm text-violet-200 transition hover:bg-violet-400/20"
                >
                  Open current stage
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-white/70">
              <span>
                {loading
                  ? "Loading roadmap progress..."
                  : `${overallStats.completed} of ${overallStats.total} tasks complete`}
              </span>
              <span>{loading ? "..." : `${overallStats.percent}%`}</span>
            </div>

            <div className="h-3 w-full rounded-full bg-white/10">
              <div
                className="h-3 rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${loading ? 0 : overallStats.percent}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="text-2xl font-medium text-white">Roadmap stages</h3>
            <p className="text-sm text-white/60">
              Open any stage to work through that slice of the journey in a
              focused way.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="h-5 w-32 rounded bg-white/10" />
                  <div className="mt-3 h-4 w-full rounded bg-white/5" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-white/5" />
                  <div className="mt-5 h-2 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stageSummaries.map((stage) => (
                <Link
                  key={stage.key}
                  href={`/roadmap/${stage.key}`}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-medium text-white transition group-hover:text-violet-200">
                        {stage.label}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-white/60">
                        {stage.description}
                      </p>
                    </div>

                    <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
                      {stage.percent}%
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm text-white/65">
                      <span>
                        {stage.completed} / {stage.total} complete
                      </span>
                      <span>
                        {stage.total === 0 ? "No tasks" : "Open stage"}
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${stage.percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </WhisperLayout>
  );
}
