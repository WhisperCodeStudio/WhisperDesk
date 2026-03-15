"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import WhisperLayout from "../components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "../data/master-tasks";

type RoadmapTask = Task & {
  stage?: string | null;
  stage_order?: number | null;
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

export default function RoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      const { data, error } = await supabase.from("tasks").select("*");

      if (error) {
        console.error("Error loading tasks:", error);
        return;
      }

      if (data) setTasks(data);
      setLoading(false);
    };

    loadTasks();
  }, []);

  const stageStats = useMemo(() => {
    return STAGE_ORDER.map((stage) => {
      const stageTasks = tasks.filter((task) => task.stage === stage);

      const completed = stageTasks.filter((t) => t.completed).length;

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

  const currentStage = useMemo(() => {
    return STAGE_ORDER.find((stage) =>
      tasks.some((task) => task.stage === stage && !task.completed),
    );
  }, [tasks]);

  return (
    <WhisperLayout>
      <div>
        <h2 className="text-3xl text-white mb-2">Founder Roadmap</h2>
        <p className="text-white/70 mb-8">
          Move through the studio in a calm, sensible order.
        </p>

        {loading ? (
          <p className="text-white/60">Loading roadmap...</p>
        ) : (
          <div className="space-y-6">
            {stageStats.map((stage) => (
              <div
                key={stage.key}
                className={`rounded-2xl border p-6 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition ${
                  stage.key === currentStage
                    ? "border-violet-400/40 bg-violet-400/10"
                    : "border-white/10 bg-[rgba(255,255,255,0.04)]"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl text-white">{stage.label}</h3>

                    <p className="text-sm text-white/60 mt-1">
                      {stage.description}
                    </p>
                  </div>

                  {stage.key === currentStage && (
                    <span className="text-xs text-violet-300 border border-violet-400/30 bg-violet-400/15 px-2 py-1 rounded-full">
                      Current stage
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-sm text-white/70 mb-2">
                  <span>
                    {stage.completed} of {stage.total} complete
                  </span>

                  <span>{stage.percent}%</span>
                </div>

                <div className="h-2 w-full rounded-full bg-white/10 mb-4">
                  <div
                    className="h-2 rounded-full bg-violet-500 transition-all"
                    style={{ width: `${stage.percent}%` }}
                  />
                </div>

                <Link
                  href={`/roadmap/${stage.key}`}
                  className="text-sm text-violet-400 hover:underline"
                >
                  Open stage →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </WhisperLayout>
  );
}
