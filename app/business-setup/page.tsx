"use client";

import { useEffect, useState } from "react";
import WhisperLayout from "../components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "../data/master-tasks";

const tabs = [
  { key: "strategy", label: "Strategy" },
  { key: "business", label: "Business Foundations" },
  { key: "business_admin", label: "Business Admin" },
  { key: "brand", label: "Brand Identity" },
  { key: "website", label: "Website" },
  { key: "marketing", label: "Marketing" },
] as const;

export default function BusinessSetupPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("strategy");

  useEffect(() => {
    async function loadTasks() {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("id", { ascending: true });

      if (error || !data) {
        console.error("Error loading business setup tasks:", error);
        setLoading(false);
        return;
      }

      const businessTasks = data.filter(
        (task) =>
          task.category === "business" ||
          task.category === "business_admin" ||
          task.category === "strategy" ||
          task.category === "brand" ||
          task.category === "branding" ||
          task.category === "website" ||
          task.category === "marketing",
      );

      setTasks(businessTasks);
      setLoading(false);
    }

    loadTasks();
  }, []);

  const toggleTaskCompleted = async (taskId: number, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed } : task)),
    );
  };

  const getTasksForTab = (tabKey: string) => {
    return tasks.filter((task) => {
      if (tabKey === "brand") {
        return task.category === "brand" || task.category === "branding";
      }

      return task.category === tabKey;
    });
  };

  const filteredTasks = getTasksForTab(activeTab);

  const completedCount = filteredTasks.filter((task) => task.completed).length;

  return (
    <WhisperLayout>
      <div>
        <h2 className="mb-2 text-3xl">Business Setup</h2>
        <p className="mb-8 text-(--whisper-muted)">
          Build the foundations of WhisperCode.
        </p>

        <div className="mb-8 flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const tabTasks = getTasksForTab(tab.key);
            const tabCount = tabTasks.length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                  isActive
                    ? "bg-(--whisper-primary) text-white"
                    : "border border-white/10 bg-white/5 text-(--whisper-muted) hover:bg-white/10"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-(--whisper-muted)"
                  }`}
                >
                  {tabCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="mb-4">
            <h3 className="text-xl text-white">
              {tabs.find((tab) => tab.key === activeTab)?.label}
            </h3>
            <p className="text-sm text-(--whisper-muted)">
              {loading
                ? "Loading tasks..."
                : `${completedCount} of ${filteredTasks.length} complete`}
            </p>
          </div>

          {loading ? (
            <p className="text-(--whisper-muted)">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <p className="text-(--whisper-muted)">
              No tasks found in this section.
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-(--whisper-primary)"
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

                    {task.description && (
                      <span className="text-sm text-(--whisper-muted)">
                        {task.description}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WhisperLayout>
  );
}
