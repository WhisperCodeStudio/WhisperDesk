"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WhisperLayout from "./components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "./data/master-tasks";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [topTasks, setTopTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning Lexii"
      : hour < 18
        ? "Good afternoon Lexii"
        : "Good evening Lexii";

  const chooseThree = (taskList: Task[]): Task[] => {
    const incompleteTasks = taskList.filter((task) => !task.completed);
    const shuffled = [...incompleteTasks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  useEffect(() => {
    async function loadTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("id", { ascending: true });

      console.log("Supabase tasks:", data);
      console.log("Supabase error:", error);

      if (error || !data) {
        setLoading(false);
        return;
      }

      setTasks(data);
      setTopTasks(chooseThree(data));
      setLoading(false);
    }

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

  const toggleTaskCompleted = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed } : task,
    );

    setTasks(updatedTasks);

    setTopTasks((prevTopTasks) =>
      prevTopTasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task,
      ),
    );
  };

  const businessTasks = tasks.filter(
    (task) =>
      task.category === "business" ||
      task.category === "business_admin" ||
      task.category === "strategy",
  );

  const completedBusinessTasks = businessTasks.filter(
    (task) => task.completed,
  ).length;

  const tasksCompletedToday = tasks.filter((task) => {
    if (!task.completed || !task.updated_at) return false;

    const today = new Date().toDateString();
    const updated = new Date(task.updated_at).toDateString();

    return today === updated;
  }).length;

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

        <p className="text-white/70">Here&apos;s your command centre.</p>

        <p className="mb-8 mt-2 text-sm text-white/60">{getDailyMessage()}</p>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <h3 className="mb-4 text-xl text-white">Today&apos;s Top 3</h3>

            {loading ? (
              <p className="text-white/60">Loading tasks...</p>
            ) : topTasks.length === 0 ? (
              <p className="text-white/60">No tasks found.</p>
            ) : allTopTasksComplete ? (
              <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4">
                <p className="text-base text-white">✨ Daily focus complete</p>
                <p className="mt-1 text-sm text-white/70">
                  The studio moved forward today. Yay you.
                </p>
                <button
                  onClick={() => setTopTasks(chooseThree(tasks))}
                  className="mt-4 text-sm text-violet-400 hover:underline"
                >
                  Choose another 3
                </button>
              </div>
            ) : (
              <>
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

                      <div className="flex flex-col gap-1">
                        <span
                          className={`transition ${
                            task.completed
                              ? "line-through opacity-50"
                              : "text-white"
                          }`}
                        >
                          {task.title || task.text}
                        </span>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-white/60">{task.category}</span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityPill(
                              task.priority,
                            )}`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setTopTasks(chooseThree(tasks))}
                  className="mt-4 text-sm text-violet-400 hover:underline"
                >
                  Choose another 3
                </button>
              </>
            )}
          </div>

          <Link href="/business-setup">
            <div className="cursor-pointer rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:border-violet-400/40">
              <h3 className="mb-2 text-xl text-white">Business Setup</h3>

              <p className="text-white/70">
                {completedBusinessTasks} of {businessTasks.length} tasks
                complete
              </p>

              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-violet-500"
                  style={{
                    width: `${
                      businessTasks.length
                        ? (completedBusinessTasks / businessTasks.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </WhisperLayout>
  );
}
