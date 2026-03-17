"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/app/data/master-tasks";

type RoadmapTask = Task & {
  stage?: string | null;
  stage_order?: number | null;
  flow_order?: number | null;
  depends_on_title?: string | null;
};

type Stage =
  | "foundation"
  | "infrastructure"
  | "presence"
  | "growth"
  | "product"
  | "rhythm";

type Props = {
  stage: Stage;
};

const STAGE_ORDER: Stage[] = [
  "foundation",
  "infrastructure",
  "presence",
  "growth",
  "product",
  "rhythm",
];

const STAGE_LABELS: Record<Stage, string> = {
  foundation: "Foundation",
  infrastructure: "Infrastructure",
  presence: "Brand & Presence",
  growth: "Growth",
  product: "Product",
  rhythm: "Founder Rhythm",
};

const STAGE_DESCRIPTIONS: Record<Stage, string> = {
  foundation: "Core business direction, offers, and structure.",
  infrastructure: "Systems, admin, and delivery support.",
  presence: "Brand, website, and portfolio visibility.",
  growth: "Marketing, lead flow, and launch momentum.",
  product: "Studio tools and product-building work.",
  rhythm: "Founder routines and sustainable cadence.",
};

export default function RoadmapStage({ stage }: Props) {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("stage", stage)
          .order("flow_order", { ascending: true })
          .order("title", { ascending: true });

        if (error) {
          console.error("Error loading stage tasks:", error);
          return;
        }

        setTasks((data as RoadmapTask[]) || []);
      } catch (err) {
        console.error("Unexpected error loading stage tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [stage]);

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

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, completed, updated_at: updatedAt }
          : task,
      ),
    );
  };

  const completedTitles = useMemo(() => {
    return new Set(
      tasks.filter((task) => task.completed).map((task) => task.title),
    );
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const flowA = a.flow_order ?? 999;
      const flowB = b.flow_order ?? 999;
      if (flowA !== flowB) return flowA - flowB;

      return (a.title || "").localeCompare(b.title || "");
    });
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const percentComplete = totalTasks
    ? Math.round((completedCount / totalTasks) * 100)
    : 0;

  const currentStageIndex = STAGE_ORDER.indexOf(stage);
  const previousStage =
    currentStageIndex > 0 ? STAGE_ORDER[currentStageIndex - 1] : null;
  const nextStage =
    currentStageIndex < STAGE_ORDER.length - 1
      ? STAGE_ORDER[currentStageIndex + 1]
      : null;

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

  const prettifyCategory = (category?: string | null) => {
    if (!category) return "Uncategorised";

    if (category === "business_admin") return "Business Admin";
    if (category === "founder_ritual") return "Founder Ritual";
    if (category === "product_build") return "Product Build";

    return category
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/roadmap"
          className="text-sm text-violet-400 hover:underline"
        >
          ← Back to Roadmap
        </Link>
      </div>

      <div className="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl text-white">{STAGE_LABELS[stage]}</h2>
            <p className="mt-2 text-white/70">{STAGE_DESCRIPTIONS[stage]}</p>
          </div>

          <span className="rounded-full border border-violet-400/30 bg-violet-400/15 px-3 py-1 text-sm text-violet-300">
            Stage view
          </span>
        </div>

        <div className="mb-2 flex items-center justify-between text-sm text-white/70">
          <span>
            {completedCount} of {totalTasks} complete
          </span>
          <span>{percentComplete}%</span>
        </div>

        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-violet-500 transition-all"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="mb-4">
          <h3 className="text-xl text-white">Stage Tasks</h3>
          <p className="mt-1 text-sm text-white/60">
            Work through this stage in a calm, logical order.
          </p>
        </div>

        {loading ? (
          <p className="text-white/60">Loading stage tasks...</p>
        ) : sortedTasks.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white">No tasks in this stage yet.</p>
            <p className="mt-1 text-sm text-white/60">
              This stage is ready for future roadmap additions.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {sortedTasks.map((task) => {
              const isLocked =
                !!task.depends_on_title &&
                !completedTitles.has(task.depends_on_title);

              return (
                <li key={task.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-violet-500"
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
                        {prettifyCategory(task.category)}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityPill(
                          task.priority,
                        )}`}
                      >
                        {task.priority?.toUpperCase()}
                      </span>

                      {typeof task.flow_order === "number" ? (
                        <span className="text-white/40">
                          Flow {task.flow_order}
                        </span>
                      ) : null}
                    </div>

                    {task.depends_on_title ? (
                      <p
                        className={`text-xs ${
                          isLocked ? "text-amber-300/80" : "text-white/45"
                        }`}
                      >
                        {isLocked
                          ? `🔒 Locked until: ${task.depends_on_title}`
                          : `Depends on: ${task.depends_on_title}`}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          {previousStage ? (
            <Link
              href={`/roadmap/${previousStage}`}
              className="text-sm text-violet-400 hover:underline"
            >
              ← {STAGE_LABELS[previousStage]}
            </Link>
          ) : (
            <span className="text-sm text-white/30">← No previous stage</span>
          )}
        </div>

        <div>
          {nextStage ? (
            <Link
              href={`/roadmap/${nextStage}`}
              className="text-sm text-violet-400 hover:underline"
            >
              {STAGE_LABELS[nextStage]} →
            </Link>
          ) : (
            <span className="text-sm text-white/30">No next stage →</span>
          )}
        </div>
      </div>
    </div>
  );
}
