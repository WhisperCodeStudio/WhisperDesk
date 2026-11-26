/**
 * WhisperDesk Page: Roadmap
 * Route: /roadmap
 * Purpose: Project-aware roadmap using the familiar stage layout
 */

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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
  stage?: Stage | string | null;
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

type StageMeta = {
  key: Stage;
  label: string;
  description: string;
};

type StageSummary = StageMeta & {
  total: number;
  completed: number;
  open: number;
  percent: number;
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

const STAGES: StageMeta[] = [
  {
    key: "foundation",
    label: "Foundation",
    description: "Grounding, decisions, setup, and first clear shape.",
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    description: "Systems, files, tooling, admin, and support structure.",
  },
  {
    key: "presence",
    label: "Presence",
    description: "Public face, website, brand, community, and visibility.",
  },
  {
    key: "growth",
    label: "Growth",
    description: "Marketing, launches, outreach, and momentum work.",
  },
  {
    key: "product",
    label: "Product",
    description: "Builds, content, features, offers, and deliverables.",
  },
  {
    key: "rhythm",
    label: "Rhythm",
    description: "Reviews, routines, maintenance, and sustainable progress.",
  },
];

export default function RoadmapPage() {
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_PROJECT_ID;

    return new URLSearchParams(window.location.search).get("project") || DEFAULT_PROJECT_ID;
  });
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStage, setNewTaskStage] = useState<Stage>("foundation");
  const [newTaskPriority, setNewTaskPriority] =
    useState<Task["priority"]>("medium");
  const [newTaskSaving, setNewTaskSaving] = useState(false);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);

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

  const loadTasks = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
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
      .channel("roadmap-projects-tasks")
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

  const selectedProjectChildren = useMemo(() => {
    return projects
      .filter((project) => project.parent_project_id === selectedProjectId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, selectedProjectId]);

  const selectedProjectIds = useMemo(
    () => getProjectIdsForSelection(selectedProjectId, projects),
    [getProjectIdsForSelection, projects, selectedProjectId],
  );

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => selectedProjectIds.has(getTaskProjectId(task)));
  }, [getTaskProjectId, selectedProjectIds, tasks]);

  const overallStats = useMemo(() => {
    const total = visibleTasks.length;
    const completed = visibleTasks.filter((task) => task.completed).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }, [visibleTasks]);

  const stageSummaries = useMemo<StageSummary[]>(() => {
    return STAGES.map((stage) => {
      const stageTasks = visibleTasks.filter((task) => task.stage === stage.key);
      const total = stageTasks.length;
      const completed = stageTasks.filter((task) => task.completed).length;
      const percent = total ? Math.round((completed / total) * 100) : 0;

      return {
        ...stage,
        total,
        completed,
        open: total - completed,
        percent,
      };
    });
  }, [visibleTasks]);

  const currentStage = useMemo(() => {
    return (
      stageSummaries.find(
        (stage) => stage.total > 0 && stage.completed < stage.total,
      ) ??
      stageSummaries.find((stage) => stage.total > 0) ??
      null
    );
  }, [stageSummaries]);

  const addRoadmapTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = newTaskTitle.trim();
    const description = newTaskDescription.trim();
    if (!title) {
      setNewTaskError("Add a task title first.");
      return;
    }

    setNewTaskSaving(true);
    setNewTaskError(null);

    const stageOrder =
      STAGES.findIndex((stage) => stage.key === newTaskStage) + 1 || 1;
    const existingStageTasks = visibleTasks.filter(
      (task) => task.stage === newTaskStage,
    );
    const nextFlowOrder =
      Math.max(0, ...existingStageTasks.map((task) => task.flow_order ?? 0)) + 1;
    const now = new Date().toISOString();

    const { error } = await supabase.from("tasks").insert({
      id: crypto.randomUUID(),
      title,
      description: description || null,
      completed: false,
      priority: newTaskPriority,
      category: "roadmap_manual",
      archived: false,
      created_at: now,
      updated_at: now,
      source: "roadmap",
      task_type: "manual",
      stage: newTaskStage,
      stage_order: stageOrder,
      depends_on_title: null,
      flow_order: nextFlowOrder,
      project_id: selectedProjectId,
    });

    if (error) {
      console.error("Error adding roadmap task:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      setNewTaskError(error.message || "I could not add that task yet.");
      setNewTaskSaving(false);
      return;
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    await loadTasks();
    setNewTaskSaving(false);
  };

  return (
    <WhisperLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl text-white md:text-4xl">Roadmap</h1>
            <p className="mt-2 text-white/70">
              What would you like to work on today?
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:border-violet-400/40 hover:bg-violet-400/10 hover:text-violet-200"
          >
            Back to dashboard
          </Link>
        </div>

        <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200/90">
                {selectedProject.name} roadmap
              </span>

              <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                Pick a project, then follow the same calm path
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/70 md:text-base">
                The layout stays familiar for every project. Choose what you
                want to work on today, then move through its stages one piece at
                a time.
              </p>

              {selectedProjectChildren.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedProjectChildren.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-violet-400/35 hover:bg-violet-400/10 hover:text-white"
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="min-w-65 rounded-2xl border border-white/10 bg-white/5 p-4">
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.16em] text-white/45">
                Project focus
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="mt-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none transition focus:border-violet-400"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.parent_project_id ? "  - " : ""}
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-5 border-t border-white/10 pt-4">
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
              </div>
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

          <form
            onSubmit={addRoadmapTask}
            className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white">Add roadmap task</h3>
              <p className="mt-1 text-sm text-white/60">
                Adds a new step to {selectedProject.name}.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_11rem_10rem_auto] lg:items-end">
              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-4">
                Task
                <input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="Add the next step..."
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-4">
                Description
                <textarea
                  value={newTaskDescription}
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                  placeholder="Add notes, context, or the tiny first step..."
                  rows={3}
                  className="resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60">
                Stage
                <select
                  value={newTaskStage}
                  onChange={(event) => setNewTaskStage(event.target.value as Stage)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  {STAGES.map((stage) => (
                    <option key={stage.key} value={stage.key}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60">
                Priority
                <select
                  value={newTaskPriority}
                  onChange={(event) =>
                    setNewTaskPriority(event.target.value as Task["priority"])
                  }
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={newTaskSaving}
                className="rounded-xl border border-violet-400/35 bg-violet-500/20 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {newTaskSaving ? "Adding..." : "Add task"}
              </button>
            </div>

            {newTaskError ? (
              <p className="mt-3 text-sm text-red-300">{newTaskError}</p>
            ) : null}
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.04)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="mb-6 flex flex-col gap-2">
            <h3 className="text-2xl font-medium text-white">Roadmap stages</h3>
            <p className="text-sm text-white/60">
              {selectedProject.name} shown in the same roadmap layout.
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
                  href={`/roadmap/${stage.key}?project=${selectedProjectId}`}
                  className={`group block rounded-2xl border p-5 transition hover:border-violet-400/35 hover:bg-violet-400/10 ${
                    currentStage?.key === stage.key
                      ? "border-violet-400/40 bg-violet-400/10"
                      : "border-white/10 bg-white/5"
                  }`}
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
                      <span>{stage.open === 0 ? "Clear" : `${stage.open} open`}</span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${stage.percent}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-violet-300/85 transition group-hover:text-violet-200">
                    Open task list -&gt;
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </WhisperLayout>
  );
}






