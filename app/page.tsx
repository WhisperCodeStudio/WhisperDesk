/**
 * 📍 WhisperDesk Page: Dashboard
 * 🗂 Route: /
 * 🧭 Purpose: Main overview with progress, next tasks, and quick actions
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WhisperLayout from "./components/whisper-layout";
import { supabase } from "@/lib/supabase";
import type { Task } from "./data/master-tasks";

type RoadmapTask = Task & {
  stage?: string | null;
  stage_order?: number | null;
  flow_order?: number | null;
  depends_on_title?: string | null;
  project?: string | null;
  project_id?: string | null;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  parent_project_id?: string | null;
};

const STAGE_LABELS: Record<string, string> = {
  foundation: "Foundation",
  infrastructure: "Infrastructure",
  presence: "Brand & Presence",
  growth: "Growth",
  product: "Product",
  rhythm: "Founder Rhythm",
};



const DEFAULT_PROJECT_ID = "whispercode-business";

const FALLBACK_PROJECTS: Project[] = [
  {
    id: DEFAULT_PROJECT_ID,
    name: "WhisperCode - Business",
    description: "Studio, offers, clients, systems, admin, and growth.",
  },
  {
    id: "nomad-rose-fivem",
    name: "Nomad Rose - FiveM",
    description: "Server, scripts, community, worldbuilding, and design.",
  },
  {
    id: "apps",
    name: "Apps",
    description: "Product lab for app ideas, builds, and launches.",
  },
  {
    id: "holbeton-events",
    name: "Holbeton Events",
    description: "Local events, planning, promotion, and logistics.",
  },
  {
    id: "books",
    name: "Books",
    description: "Writing ideas, outlines, drafts, and publishing steps.",
  },
  {
    id: "village-computer-classes",
    name: "Computer Classes",
    description: "Lessons, schedules, learners, materials, and community support.",
  },
  {
    id: "app-insurance-policy-renewal",
    name: "Insurance Policy Renewal",
    parent_project_id: "apps",
  },
  {
    id: "app-kindred-archives-companion",
    name: "Kindred Archives Companion",
    parent_project_id: "apps",
  },
  { id: "app-symptosync", name: "SymptoSync", parent_project_id: "apps" },
  {
    id: "app-whispergrimoire",
    name: "whispergrimoire",
    parent_project_id: "apps",
  },
  { id: "app-whispernest", name: "WhisperNest", parent_project_id: "apps" },
  { id: "app-whisperverse", name: "whisperverse", parent_project_id: "apps" },
];

export default function Home() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProjectId, setSelectedProjectId] =
    useState(DEFAULT_PROJECT_ID);

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning Lexii"
      : hour < 18
        ? "Good afternoon Lexii"
        : "Good evening Lexii";

  const getTaskProjectId = useCallback(
    (task: RoadmapTask) => task.project_id || task.project || DEFAULT_PROJECT_ID,
    [],
  );

  const getProjectIdsForSelection = useCallback(
    (projectId: string, projectList: Project[]) =>
      new Set([
        projectId,
        ...projectList
          .filter((project) => project.parent_project_id === projectId)
          .map((project) => project.id),
      ]),
    [],
  );

  const chooseNextThree = useCallback(
    (taskList: RoadmapTask[], projectIds: Set<string>): RoadmapTask[] => {
      const incompleteTasks = [...taskList]
        .filter(
          (task) => !task.completed && projectIds.has(getTaskProjectId(task)),
        )
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
    },
    [getTaskProjectId],
  );

  const getCurrentStage = useCallback(
    (taskList: RoadmapTask[], projectIds: Set<string>): string | null => {
      const incompleteTasks = [...taskList]
        .filter(
          (task) => !task.completed && projectIds.has(getTaskProjectId(task)),
        )
        .sort((a, b) => {
          const stageA = a.stage_order ?? 999;
          const stageB = b.stage_order ?? 999;
          if (stageA !== stageB) return stageA - stageB;

          const flowA = a.flow_order ?? 999;
          const flowB = b.flow_order ?? 999;
          if (flowA !== flowB) return flowA - flowB;

          return (a.title || "").localeCompare(b.title || "");
        });

      if (incompleteTasks.length === 0) return null;

      return incompleteTasks[0].stage ?? null;
    },
    [getTaskProjectId],
  );
  const loadTasks = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("stage_order", { ascending: true })
        .order("flow_order", { ascending: true })
        .order("title", { ascending: true });

      if (error) {
        console.error("Failed to load tasks:", error);
        return;
      }

      const nextTasks = (data as RoadmapTask[]) || [];
      setTasks(nextTasks);
    } catch (err) {
      console.error("Unexpected error loading tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status, parent_project_id")
        .order("parent_project_id", { ascending: true, nullsFirst: true })
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to load projects:", error);
        return;
      }

      const nextProjects = (data as Project[]) || [];
      const mergedProjects = [...nextProjects];

      FALLBACK_PROJECTS.forEach((fallbackProject) => {
        if (!mergedProjects.some((project) => project.id === fallbackProject.id)) {
          mergedProjects.push(fallbackProject);
        }
      });

      if (mergedProjects.length === 0) return;
      setProjects((currentProjects) => {
        const currentSignature = JSON.stringify(currentProjects);
        const nextSignature = JSON.stringify(mergedProjects);

        return currentSignature === nextSignature ? currentProjects : mergedProjects;
      });

      if (!mergedProjects.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId(mergedProjects[0].id);
      }
    } catch (err) {
      console.error("Unexpected error loading projects:", err);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, [loadProjects, loadTasks]);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadTasks();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          loadProjects();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProjects, loadTasks]);

  const selectedProject = useMemo(() => {
    return (
      projects.find((project) => project.id === selectedProjectId) ||
      projects[0] ||
      FALLBACK_PROJECTS[0]
    );
  }, [projects, selectedProjectId]);

  const selectedProjectIds = useMemo(
    () => getProjectIdsForSelection(selectedProjectId, projects),
    [getProjectIdsForSelection, projects, selectedProjectId],
  );

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => selectedProjectIds.has(getTaskProjectId(task)));
  }, [getTaskProjectId, selectedProjectIds, tasks]);

  const topTasks = useMemo(
    () => chooseNextThree(visibleTasks, selectedProjectIds),
    [chooseNextThree, selectedProjectIds, visibleTasks],
  );

  const currentStage = useMemo(
    () => getCurrentStage(visibleTasks, selectedProjectIds),
    [getCurrentStage, selectedProjectIds, visibleTasks],
  );

  const selectedProjectChildren = useMemo(() => {
    return projects
      .filter((project) => project.parent_project_id === selectedProjectId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, selectedProjectId]);

  const selectedProjectChildCount = selectedProjectChildren.length;
  const hasProjectLanes = selectedProjectChildCount > 0;

  const projectCompletionStats = useMemo(() => {
    return projects
      .filter((project) => !project.parent_project_id)
      .map((project) => {
        const projectIds = getProjectIdsForSelection(project.id, projects);
        const projectTasks = tasks.filter((task) =>
          projectIds.has(getTaskProjectId(task)),
        );
        const completed = projectTasks.filter((task) => task.completed).length;
        const total = projectTasks.length;
        const percent = total ? Math.round((completed / total) * 100) : 0;

        return {
          ...project,
          completed,
          total,
          open: total - completed,
          percent,
        };
      });
  }, [getProjectIdsForSelection, getTaskProjectId, projects, tasks]);
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

    if (category === "business_admin") return "Business Admin";
    if (category === "founder_ritual") return "Founder Ritual";
    if (category === "product_build") return "Product Build";

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

    await loadTasks();
  };

  const tasksCompletedToday = visibleTasks.filter((task) => {
    if (!task.completed || !task.updated_at) return false;

    const today = new Date().toDateString();
    const updated = new Date(task.updated_at).toDateString();

    return today === updated;
  }).length;


  const getDailyMessage = () => {
    if (tasksCompletedToday === 0) {
      return "A fresh start for this project today.";
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
        <p className="text-white/70">A calm command centre for {selectedProject.name}.</p>
        <p className="mb-8 mt-2 text-sm text-white/60">{getDailyMessage()}</p>
        {selectedProjectChildCount > 0 ? (
          <p className="mb-6 text-xs text-white/45">
            Includes {selectedProjectChildCount} app lane
            {selectedProjectChildCount === 1 ? "" : "s"} under this project.
          </p>
        ) : null}

        <div
          className={`grid gap-6 ${
            hasProjectLanes ? "xl:grid-cols-[1.2fr_0.8fr]" : "grid-cols-1"
          }`}
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-xl text-white">Next 3</h3>
                  <p className="mt-1 text-sm text-white/60">
                    {selectedProject.description}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-violet-300/80">
                    {currentStage ? getStagePill(currentStage) : "All Done"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                  <label className="sr-only" htmlFor="project-focus">
                    Choose project
                  </label>
                  <select
                    id="project-focus"
                    value={selectedProjectId}
                    onChange={(e) => {
                      setSelectedProjectId(e.target.value);
                    }}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.parent_project_id ? "  · " : ""}{project.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => loadTasks(true)}
                    disabled={refreshing}
                    className="text-sm text-violet-400 hover:underline disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
              {loading ? (
                <p className="text-white/60">Loading tasks...</p>
              ) : topTasks.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-white">No tasks for this project yet.</p>
                  <p className="mt-1 text-sm text-white/60">
                    This space is ready when {selectedProject.name} has its
                    first steps.
                  </p>
                </div>
              ) : allTopTasksComplete ? (
                <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-4">
                  <p className="text-base text-white">
                    ✨ Current focus complete
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    This project moved forward today. Choose the next three when
                    you&apos;re ready.
                  </p>
                  <button
                    onClick={() => loadTasks(true)}
                    disabled={refreshing}
                    className="mt-4 text-sm text-violet-400 hover:underline disabled:opacity-50"
                  >
                    {refreshing ? "Refreshing..." : "Show next 3"}
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
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl text-white">Project completion</h3>
                  <p className="mt-1 text-sm text-white/60">
                    A visual read of each big project&apos;s progress.
                  </p>
                </div>

                <p className="text-xs uppercase tracking-[0.18em] text-violet-300/80">
                  Whole desk
                </p>
              </div>

              {loading ? (
                <p className="text-white/60">Loading project charts...</p>
              ) : (
                <div
                  className={`grid gap-4 ${
                    hasProjectLanes
                      ? "md:grid-cols-2"
                      : "md:grid-cols-2 2xl:grid-cols-3"
                  }`}
                >
                  {projectCompletionStats.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        }}
                      className={`group min-h-34 rounded-2xl border p-4 text-left transition hover:border-violet-400/35 hover:bg-violet-400/10 ${
                        selectedProjectId === project.id
                          ? "border-violet-400/40 bg-violet-400/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="grid gap-4 sm:grid-cols-[5rem_1fr] sm:items-center">
                        <div
                          className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full"
                          style={{
                            background: `conic-gradient(#8b5cf6 ${project.percent}%, rgba(255,255,255,0.1) 0)`,
                          }}
                          aria-label={`${project.percent}% complete`}
                        >
                          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#070b1a] text-sm font-medium text-white">
                            {project.percent}%
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-base leading-5 text-white group-hover:text-violet-100">
                            {project.name}
                          </h4>
                          <p className="mt-1 text-sm text-white/55">
                            {project.completed} of {project.total} complete
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            {project.open} open
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {hasProjectLanes ? (
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <h3 className="text-xl text-white">Project lanes</h3>
                <p className="mt-1 text-sm text-white/60">
                  Choose a child project when you want a narrower focus.
                </p>

                <div className="mt-4 space-y-2">
                  {selectedProjectChildren.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        }}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-white"
                    >
                      <span>{project.name}</span>
                      <span className="text-white/35">Open</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WhisperLayout>
  );
}


