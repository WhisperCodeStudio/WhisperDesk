"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import WhisperLayout from "./components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "./data/master-tasks";

type RoadmapTask = Task & {
  stage?: string | null;
  stage_order?: number | null;
  flow_order?: number | null;
  depends_on_title?: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  foundation: "Foundation",
  infrastructure: "Infrastructure",
  presence: "Brand & Presence",
  growth: "Growth",
  product: "Product",
  rhythm: "Founder Rhythm",
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  foundation: "Core business direction, offers, and structure.",
  infrastructure: "Systems, admin, and delivery support.",
  presence: "Brand, website, and portfolio visibility.",
  growth: "Marketing, lead flow, and launch momentum.",
  product: "Studio tools and product-building work.",
  rhythm: "Founder routines and sustainable cadence.",
};

const STAGE_ORDER = [
  "foundation",
  "infrastructure",
  "presence",
  "growth",
  "product",
  "rhythm",
];

export default function Home() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [topTasks, setTopTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullRoadmap, setShowFullRoadmap] = useState(false);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning Lexii"
      : hour < 18
        ? "Good afternoon Lexii"
        : "Good evening Lexii";

  const chooseNextThree = (taskList: RoadmapTask[]): RoadmapTask[] => {
    const incompleteTasks = [...taskList]
      .filter((task) => !task.completed)
      .sort((a, b) => {
        const stageA = a.stage_order ?? 999;
        const stageB = b.stage_order ?? 999;
        if (stageA !== stageB) return stageA - stageB;

        const flowA = a.flow_order ?? 999;
        const flowB = b.flow_order ?? 999;
        if (flowA !== flowB) return flowA - flowB;

        return (a.title || "").localeCompare(b.title || "");
      });

    if (incompleteTasks.length === 0) return [];

    const currentStageOrder = incompleteTasks[0].stage_order;

    return incompleteTasks
      .filter((task) => task.stage_order === currentStageOrder)
      .slice(0, 3);
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("stage_order", { ascending: true })
          .order("flow_order", { ascending: true });

        if (error) {
          console.error("Failed to load tasks:", error);
          return;
        }

        if (!data) return;

        setTasks(data);
        setTopTasks(chooseNextThree(data));
      } catch (err) {
        console.error("Unexpected error loading tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const getPriorityPill = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "border border-red-500/30 bg-red-500/20 text-red-400";
      case "medium":
        return "border border-amber-400/30 bg-amber-400/20 text-amber-300";
      case "low":
        return "border border-green-500/30 bg-green-500/20 text-green-400";
      default:
        return "border border-white/10 bg-white/10 text-white";
    }
  };

  const getStagePill = (stage?: string | null) => {
    return STAGE_LABELS[stage || ""] || "Unsorted";
  };

  const prettifyCategory = (category?: string | null) => {
    if (!category) return "Uncategorised";
    return category
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const toggleTaskCompleted = async (taskId: string, completed: boolean) => {
    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("tasks")
      .update({ completed, updated_at: updatedAt })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed, updated_at: updatedAt } : task,
    );

    setTasks(updatedTasks);
    setTopTasks(chooseNextThree(updatedTasks));
  };

  const tasksCompletedToday = tasks.filter((task) => {
    if (!task.completed || !task.updated_at) return false;

    const today = new Date().toDateString();
    const updated = new Date(task.updated_at).toDateString();

    return today === updated;
  }).length;

  const totalCompleted = tasks.filter((task) => task.completed).length;

  const nextUnlockedStage = useMemo(() => {
    return STAGE_ORDER.find((stage) =>
      tasks.some((task) => task.stage === stage && !task.completed),
    );
  }, [tasks]);

  const stageStats = useMemo(() => {
    return STAGE_ORDER.map((stage) => {
      const stageTasks = tasks.filter((task) => task.stage === stage);
      const completed = stageTasks.filter((task) => task.completed).length;

      return {
        key: stage,
        label: STAGE_LABELS[stage],
        description: STAGE_DESCRIPTIONS[stage],
        total: stageTasks.length,
        completed,
        percent: stageTasks.length
          ? Math.round((completed / stageTasks.length) * 100)
          : 0,
      };
    });
  }, [tasks]);

  const visibleStageStats = useMemo(() => {
    if (showFullRoadmap) return stageStats;
    return stageStats.filter((stage) => stage.key === nextUnlockedStage);
  }, [showFullRoadmap, stageStats, nextUnlockedStage]);

  const getDailyMessage = () => {
    if (tasksCompletedToday === 0) {
      return "A fresh start for the studio today.";
    }

    if (tasksCompletedToday === 1) {
      return "Nice start. One step forward.";
    }

    if (tasksCompletedToday <= 4) {
      return "Good momentum today. Yay you.";
    }

    return "Strong progress today. WhisperCode grows.";
  };

  const allTopTasksComplete =
    topTasks.length > 0 && topTasks.every((task) => task.completed);

  return (
    <WhisperLayout>
      <div>
        <h2 className="mb-2 text-3xl text-white">{greeting}</h2>
        <p className="text-white/70">Here&apos;s your founder roadmap.</p>
        <p className="mb-8 mt-2 text-sm text-white/60">{getDailyMessage()}</p>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl text-white">Next 3</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Your next calm, logical steps. No random gremlins.
                  </p>
                </div>

                <button
                  onClick={() => setTopTasks(chooseNextThree(tasks))}
                  className="text-sm text-violet-400 hover:underline"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <p className="text-white/60">Loading tasks...</p>
              ) : topTasks.length === 0 ? (
                <p className="text-white/60">No tasks found.</p>
              ) : allTopTasksComplete ? (
                <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4">
                  <p className="text-base text-white">
                    ✨ Current focus complete
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    The studio moved forward today. Choose the next three when
                    you&apos;re ready.
                  </p>
                  <button
                    onClick={() => setTopTasks(chooseNextThree(tasks))}
                    className="mt-4 text-sm text-violet-400 hover:underline"
                  >
                    Show next 3
                  </button>
                </div>
              ) : (
                <ul className="space-y-5">
                  {topTasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="peer mt-1 h-4 w-4 accent-violet-500"
                        checked={task.completed}
                        onChange={(e) =>
                          toggleTaskCompleted(task.id, e.target.checked)
                        }
                      />

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <span
                          className={`transition ${
                            task.completed
                              ? "line-through opacity-50"
                              : "text-white"
                          }`}
                        >
                          {task.title || task.text}
                        </span>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                            {getStagePill(task.stage)}
                          </span>

                          <span className="text-white/50">
                            {prettifyCategory(task.category)}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityPill(
                              task.priority,
                            )}`}
                          >
                            {task.priority?.toUpperCase()}
                          </span>
                        </div>

                        {task.depends_on_title ? (
                          <p className="text-xs text-white/45">
                            Depends on: {task.depends_on_title}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl text-white">Roadmap Progress</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Move through the studio in a sensible order.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-white/50">Overall progress</p>
                    <p className="text-lg text-white">
                      {totalCompleted} / {tasks.length}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowFullRoadmap((prev) => !prev)}
                    className="text-sm text-violet-400 hover:underline"
                  >
                    {showFullRoadmap ? "Hide roadmap" : "View full roadmap"}
                  </button>
                </div>
              </div>

              {!showFullRoadmap && nextUnlockedStage ? (
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-violet-300/80">
                  Current stage
                </p>
              ) : null}

              <div className="space-y-4">
                {visibleStageStats.length === 0 ? (
                  <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4">
                    <p className="text-base text-white">✨ Roadmap complete</p>
                    <p className="mt-1 text-sm text-white/70">
                      Every stage is complete. That deserves a little proud
                      founder moment.
                    </p>
                  </div>
                ) : (
                  visibleStageStats.map((stage) => (
                    <div
                      key={stage.key}
                      className={`rounded-xl border p-4 transition ${
                        nextUnlockedStage === stage.key
                          ? "border-violet-400/40 bg-violet-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-white">{stage.label}</h4>
                          <p className="mt-1 text-sm text-white/55">
                            {stage.description}
                          </p>
                        </div>

                        {nextUnlockedStage === stage.key ? (
                          <span className="rounded-full border border-violet-400/30 bg-violet-400/15 px-2 py-1 text-xs text-violet-300">
                            Current focus
                          </span>
                        ) : null}
                      </div>

                      <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                        <span>
                          {stage.completed} of {stage.total} complete
                        </span>
                        <span>{stage.percent}%</span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-violet-500 transition-all"
                          style={{ width: `${stage.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <h3 className="text-xl text-white">Today</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white/55">Completed today</p>
                  <p className="mt-1 text-2xl text-white">
                    {tasksCompletedToday}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white/55">Current stage</p>
                  <p className="mt-1 text-lg text-white">
                    {nextUnlockedStage
                      ? STAGE_LABELS[nextUnlockedStage]
                      : "All stages complete"}
                  </p>
                </div>
              </div>
            </div>

            <Link href="/business-setup">
              <div className="cursor-pointer rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-violet-400/40">
                <h3 className="mb-2 text-xl text-white">Open task library</h3>
                <p className="text-white/70">
                  Browse the full founder checklist in roadmap order.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </WhisperLayout>
  );
}
