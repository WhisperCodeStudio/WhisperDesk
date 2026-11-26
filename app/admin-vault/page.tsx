/**
 * WhisperDesk Page: Admin Vault
 * Route: /admin-vault
 * Purpose: Quick access to key tools, links, and business resources
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import WhisperLayout from "@/app/components/whisper-layout";
import { supabase } from "@/lib/supabase";

const DEFAULT_PROJECT_ID = "whispercode-business";
const GLOBAL_PROJECT_ID = "global";

const EMPTY_LINK_FORM = {
  label: "",
  description: "",
  href: "",
  category: "Business",
  projectId: DEFAULT_PROJECT_ID,
};

const EMPTY_NOTE_FORM = {
  title: "",
  content: "",
  noteType: "Useful Prompts",
  projectId: DEFAULT_PROJECT_ID,
};

const DEFAULT_NOTE_TYPES = [
  "Login Notes",
  "Brand Voice",
  "Launch Checklist",
  "Class Info",
  "Useful Prompts",
] as const;

const DAILY_AFFIRMATIONS = [
  "I can choose one clear thing and let that be enough.",
  "My ideas are allowed to become real slowly.",
  "I am building a life that feels like mine.",
  "Progress can be soft and still count.",
  "I do not need to hold every idea at once.",
  "Small steps are still spellwork when they are intentional.",
  "I can make this simpler and still make it beautiful.",
  "Future me deserves systems that feel kind.",
  "I am allowed to rest before I am empty.",
  "One finished thing is more powerful than ten anxious tabs.",
  "I trust myself to return to what matters.",
  "The work can be calm, and it can still be ambitious.",
  "I am not behind. I am gathering shape.",
  "Clarity can arrive one gentle decision at a time.",
] as const;

const DEFAULT_SECTIONS = [
  "Business",
  "Projects",
  "Money",
  "Legal/Admin",
  "Learning",
  "Personal Compass",
  "Files",
] as const;

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

type VaultLink = {
  id: string;
  label: string;
  description: string | null;
  href: string;
  category: string;
  project_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type VaultNote = {
  id: string;
  title: string;
  content: string;
  note_type: string;
  project_id: string | null;
  is_pinned: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  parent_project_id?: string | null;
};

type LinkForm = typeof EMPTY_LINK_FORM;
type NoteForm = typeof EMPTY_NOTE_FORM;

type SectionSummary = {
  name: string;
  count: number;
};

export default function AdminVaultPage() {
  const [affirmationIndex, setAffirmationIndex] = useState(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 0);
    const diff = Date.now() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / 86400000);

    return dayOfYear % DAILY_AFFIRMATIONS.length;
  });

  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] =
    useState(DEFAULT_PROJECT_ID);
  const [links, setLinks] = useState<VaultLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [savingLink, setSavingLink] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("All");
  const [linkForm, setLinkForm] = useState<LinkForm>(EMPTY_LINK_FORM);
  const [linkStatusMessage, setLinkStatusMessage] = useState<string | null>(
    null,
  );
  const [linkStatusType, setLinkStatusType] = useState<
    "success" | "error" | null
  >(null);

  const [notes, setNotes] = useState<VaultNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [activeNoteType, setActiveNoteType] = useState("All");
  const [noteForm, setNoteForm] = useState<NoteForm>(EMPTY_NOTE_FORM);
  const [noteStatusMessage, setNoteStatusMessage] = useState<string | null>(
    null,
  );
  const [noteStatusType, setNoteStatusType] = useState<
    "success" | "error" | null
  >(null);

  const selectedProject = useMemo(() => {
    return (
      projects.find((project) => project.id === selectedProjectId) ||
      projects[0] ||
      FALLBACK_PROJECTS[0]
    );
  }, [projects, selectedProjectId]);

  const selectedProjectLinks = useMemo(() => {
    return links.filter(
      (link) => !link.project_id || link.project_id === selectedProjectId,
    );
  }, [links, selectedProjectId]);

  const selectedProjectOwnLinkCount = useMemo(() => {
    return links.filter((link) => link.project_id === selectedProjectId).length;
  }, [links, selectedProjectId]);

  const globalLinkCount = useMemo(() => {
    return links.filter((link) => !link.project_id).length;
  }, [links]);

  const sectionSummaries = useMemo<SectionSummary[]>(() => {
    const sectionNames = new Set<string>(DEFAULT_SECTIONS);

    selectedProjectLinks.forEach((link) => {
      sectionNames.add(link.category || "Business");
    });

    return Array.from(sectionNames).map((name) => ({
      name,
      count: selectedProjectLinks.filter(
        (link) => (link.category || "Business") === name,
      ).length,
    }));
  }, [selectedProjectLinks]);

  const visibleLinks = useMemo(() => {
    if (activeSection === "All") return selectedProjectLinks;

    return selectedProjectLinks.filter(
      (link) => (link.category || "Business") === activeSection,
    );
  }, [activeSection, selectedProjectLinks]);

  const groupedLinks = useMemo(() => {
    const sectionOrder = sectionSummaries.map((section) => section.name);

    return sectionOrder
      .map((section) => ({
        section,
        links: visibleLinks.filter(
          (link) => (link.category || "Business") === section,
        ),
      }))
      .filter((group) => group.links.length > 0);
  }, [sectionSummaries, visibleLinks]);

  const selectedProjectNotes = useMemo(() => {
    return notes.filter(
      (note) => !note.project_id || note.project_id === selectedProjectId,
    );
  }, [notes, selectedProjectId]);

  const selectedProjectOwnNoteCount = useMemo(() => {
    return notes.filter((note) => note.project_id === selectedProjectId).length;
  }, [notes, selectedProjectId]);

  const globalNoteCount = useMemo(() => {
    return notes.filter((note) => !note.project_id).length;
  }, [notes]);

  const noteTypeSummaries = useMemo<SectionSummary[]>(() => {
    const noteTypeNames = new Set<string>(DEFAULT_NOTE_TYPES);

    selectedProjectNotes.forEach((note) => {
      noteTypeNames.add(note.note_type || "Useful Prompts");
    });

    return Array.from(noteTypeNames).map((name) => ({
      name,
      count: selectedProjectNotes.filter(
        (note) => (note.note_type || "Useful Prompts") === name,
      ).length,
    }));
  }, [selectedProjectNotes]);

  const visibleNotes = useMemo(() => {
    const filteredNotes =
      activeNoteType === "All"
        ? selectedProjectNotes
        : selectedProjectNotes.filter(
            (note) => (note.note_type || "Useful Prompts") === activeNoteType,
          );

    return [...filteredNotes].sort((first, second) => {
      if (first.is_pinned !== second.is_pinned) return first.is_pinned ? -1 : 1;
      if ((first.sort_order ?? 0) !== (second.sort_order ?? 0)) {
        return (first.sort_order ?? 0) - (second.sort_order ?? 0);
      }

      return first.title.localeCompare(second.title);
    });
  }, [activeNoteType, selectedProjectNotes]);

  const updateLinkProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
    setLinkForm((current) => ({
      ...current,
      projectId:
        current.projectId === GLOBAL_PROJECT_ID ? GLOBAL_PROJECT_ID : projectId,
    }));
    setNoteForm((current) => ({
      ...current,
      projectId:
        current.projectId === GLOBAL_PROJECT_ID ? GLOBAL_PROJECT_ID : projectId,
    }));
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status, parent_project_id")
        .order("parent_project_id", { ascending: true, nullsFirst: true })
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      const nextProjects = (data as Project[]) || [];
      const mergedProjects = [...nextProjects];

      FALLBACK_PROJECTS.forEach((fallbackProject) => {
        if (!mergedProjects.some((project) => project.id === fallbackProject.id)) {
          mergedProjects.push(fallbackProject);
        }
      });

      setProjects(mergedProjects);

      if (!mergedProjects.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId(mergedProjects[0]?.id ?? DEFAULT_PROJECT_ID);
      }
    } catch (error) {
      console.error("Error loading vault projects:", error);
    }
  }, [selectedProjectId]);

  async function loadLinks() {
    try {
      setLoadingLinks(true);
      setLinkStatusMessage(null);
      setLinkStatusType(null);

      const { data, error } = await supabase
        .from("admin_vault_links")
        .select(
          "id, label, description, href, category, project_id, sort_order, created_at, updated_at",
        )
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });

      if (error) {
        throw error;
      }

      setLinks((data as VaultLink[]) || []);
    } catch (error) {
      console.error("Error loading vault links:", error);
      setLinkStatusMessage("Could not load your vault links just now.");
      setLinkStatusType("error");
    } finally {
      setLoadingLinks(false);
    }
  }

  async function loadNotes() {
    try {
      setLoadingNotes(true);
      setNoteStatusMessage(null);
      setNoteStatusType(null);

      const { data, error } = await supabase
        .from("admin_vault_notes")
        .select(
          "id, title, content, note_type, project_id, is_pinned, sort_order, created_at, updated_at",
        )
        .order("is_pinned", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });

      if (error) {
        throw error;
      }

      setNotes((data as VaultNote[]) || []);
    } catch (error) {
      console.error("Error loading vault notes:", error);
      setNoteStatusMessage("Could not load your important notes just now.");
      setNoteStatusType("error");
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    void loadLinks();
    void loadNotes();
  }, [loadProjects]);

  const dailyAffirmation = DAILY_AFFIRMATIONS[affirmationIndex];

  function showNextAffirmation() {
    setAffirmationIndex((current) => (current + 1) % DAILY_AFFIRMATIONS.length);
  }

  function updateNoteForm(field: keyof NoteForm, value: string) {
    setNoteForm((current) => ({ ...current, [field]: value }));
  }

  function resetNoteForm(
    nextProjectId = selectedProjectId,
    nextNoteType = activeNoteType,
  ) {
    setEditingNoteId(null);
    setNoteForm({
      ...EMPTY_NOTE_FORM,
      noteType: nextNoteType === "All" ? "Useful Prompts" : nextNoteType,
      projectId: nextProjectId,
    });
  }

  function startEditingNote(note: VaultNote) {
    setEditingNoteId(note.id);
    setActiveNoteType(note.note_type || "Useful Prompts");
    setNoteForm({
      title: note.title,
      content: note.content,
      noteType: note.note_type,
      projectId: note.project_id ?? GLOBAL_PROJECT_ID,
    });
    setNoteStatusMessage(null);
    setNoteStatusType(null);
  }

  async function handleSaveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = noteForm.title.trim();
    const content = noteForm.content.trim();
    const noteType = noteForm.noteType.trim() || "Useful Prompts";
    const projectId =
      noteForm.projectId === GLOBAL_PROJECT_ID ? null : noteForm.projectId;

    if (!title || !content) {
      setNoteStatusMessage("Add a title and the note first.");
      setNoteStatusType("error");
      return;
    }

    try {
      setSavingNote(true);
      setNoteStatusMessage(null);
      setNoteStatusType(null);

      if (editingNoteId) {
        const { error } = await supabase
          .from("admin_vault_notes")
          .update({
            title,
            content,
            note_type: noteType,
            project_id: projectId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNoteId);

        if (error) throw error;
        setNoteStatusMessage("Important note updated.");
      } else {
        const nextSortOrder =
          Math.max(0, ...notes.map((note) => note.sort_order ?? 0)) + 10;

        const { error } = await supabase.from("admin_vault_notes").insert({
          title,
          content,
          note_type: noteType,
          project_id: projectId,
          sort_order: nextSortOrder,
        });

        if (error) throw error;
        setNoteStatusMessage("Important note added.");
      }

      setNoteStatusType("success");
      setActiveNoteType(noteType);
      if (projectId) setSelectedProjectId(projectId);
      resetNoteForm(projectId ?? GLOBAL_PROJECT_ID, noteType);
      await loadNotes();
    } catch (error) {
      console.error("Error saving vault note:", error);
      setNoteStatusMessage("Could not save that note just now.");
      setNoteStatusType("error");
    } finally {
      setSavingNote(false);
    }
  }

  async function toggleNotePin(note: VaultNote) {
    try {
      setNoteStatusMessage(null);
      setNoteStatusType(null);

      const { error } = await supabase
        .from("admin_vault_notes")
        .update({
          is_pinned: !note.is_pinned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id);

      if (error) throw error;

      setNoteStatusMessage(note.is_pinned ? "Note unpinned." : "Note pinned.");
      setNoteStatusType("success");
      await loadNotes();
    } catch (error) {
      console.error("Error pinning vault note:", error);
      setNoteStatusMessage("Could not update that note just now.");
      setNoteStatusType("error");
    }
  }

  async function handleDeleteNote(note: VaultNote) {
    const shouldDelete = window.confirm(`Remove ${note.title} from notes?`);
    if (!shouldDelete) return;

    try {
      setNoteStatusMessage(null);
      setNoteStatusType(null);

      const { error } = await supabase
        .from("admin_vault_notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;

      if (editingNoteId === note.id) resetNoteForm();
      setNoteStatusMessage("Important note removed.");
      setNoteStatusType("success");
      await loadNotes();
    } catch (error) {
      console.error("Error deleting vault note:", error);
      setNoteStatusMessage("Could not remove that note just now.");
      setNoteStatusType("error");
    }
  }

  function updateLinkForm(field: keyof LinkForm, value: string) {
    setLinkForm((current) => ({ ...current, [field]: value }));
  }

  function resetLinkForm(nextProjectId = selectedProjectId, nextCategory = activeSection) {
    setEditingLinkId(null);
    setLinkForm({
      ...EMPTY_LINK_FORM,
      category: nextCategory === "All" ? "Business" : nextCategory,
      projectId: nextProjectId,
    });
  }

  function startEditingLink(link: VaultLink) {
    setEditingLinkId(link.id);
    setActiveSection(link.category || "Business");
    setLinkForm({
      label: link.label,
      description: link.description ?? "",
      href: link.href,
      category: link.category,
      projectId: link.project_id ?? GLOBAL_PROJECT_ID,
    });
    setLinkStatusMessage(null);
    setLinkStatusType(null);
  }

  async function handleSaveLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const label = linkForm.label.trim();
    const href = linkForm.href.trim();
    const description = linkForm.description.trim();
    const category = linkForm.category.trim() || "Business";
    const projectId =
      linkForm.projectId === GLOBAL_PROJECT_ID ? null : linkForm.projectId;

    if (!label || !href) {
      setLinkStatusMessage("Add a label and a link first.");
      setLinkStatusType("error");
      return;
    }

    try {
      setSavingLink(true);
      setLinkStatusMessage(null);
      setLinkStatusType(null);

      if (editingLinkId) {
        const { error } = await supabase
          .from("admin_vault_links")
          .update({
            label,
            href,
            description: description || null,
            category,
            project_id: projectId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingLinkId);

        if (error) throw error;
        setLinkStatusMessage("Vault link updated.");
      } else {
        const nextSortOrder =
          Math.max(0, ...links.map((link) => link.sort_order ?? 0)) + 10;

        const { error } = await supabase.from("admin_vault_links").insert({
          label,
          href,
          description: description || null,
          category,
          project_id: projectId,
          sort_order: nextSortOrder,
        });

        if (error) throw error;
        setLinkStatusMessage("Vault link added.");
      }

      setLinkStatusType("success");
      setActiveSection(category);
      if (projectId) setSelectedProjectId(projectId);
      resetLinkForm(projectId ?? GLOBAL_PROJECT_ID, category);
      await loadLinks();
    } catch (error) {
      console.error("Error saving vault link:", error);
      setLinkStatusMessage("Could not save that link just now.");
      setLinkStatusType("error");
    } finally {
      setSavingLink(false);
    }
  }

  async function handleDeleteLink(link: VaultLink) {
    const shouldDelete = window.confirm(`Remove ${link.label} from the Vault?`);
    if (!shouldDelete) return;

    try {
      setLinkStatusMessage(null);
      setLinkStatusType(null);

      const { error } = await supabase
        .from("admin_vault_links")
        .delete()
        .eq("id", link.id);

      if (error) throw error;

      if (editingLinkId === link.id) resetLinkForm();
      setLinkStatusMessage("Vault link removed.");
      setLinkStatusType("success");
      await loadLinks();
    } catch (error) {
      console.error("Error deleting vault link:", error);
      setLinkStatusMessage("Could not remove that link just now.");
      setLinkStatusType("error");
    }
  }

  return (
    <WhisperLayout>
      <div className="mx-auto max-w-5xl space-y-6">
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
                Daily Boost
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                A rotating little reminder for the version of you building
                today. One soft spark, no admin required.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200/80">
              Founder only
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-300/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(14,165,233,0.08))] p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-violet-200/75">
              Today&apos;s affirmation
            </p>
            <p className="mt-4 text-2xl leading-9 text-white md:text-3xl md:leading-10">
              {dailyAffirmation}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/50">
                It changes daily, and you can nudge it when you need a different kind of magic.
              </p>

              <button
                type="button"
                onClick={showNextAffirmation}
                className="inline-flex items-center justify-center rounded-xl border border-violet-300/20 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/25"
              >
                Another boost
              </button>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl text-white md:text-2xl">
                Important Notes
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Keep reusable notes close: login reminders, brand voice, launch
                checks, class info, and prompts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => resetNoteForm()}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:border-violet-400/30 hover:text-white"
            >
              New note
            </button>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300/80">
                  Notes focus
                </p>
                <h3 className="mt-2 text-xl text-white">
                  {selectedProject.name}
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  Showing {globalNoteCount} global note
                  {globalNoteCount === 1 ? "" : "s"} plus {selectedProjectOwnNoteCount}
                  project note{selectedProjectOwnNoteCount === 1 ? "" : "s"}.
                </p>
              </div>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:min-w-72">
                Note type
                <select
                  value={activeNoteType}
                  onChange={(event) => setActiveNoteType(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  <option value="All">All note types</option>
                  {noteTypeSummaries.map((noteType) => (
                    <option key={noteType.name} value={noteType.name}>
                      {noteType.name} ({noteType.count})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveNoteType("All")}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                activeNoteType === "All"
                  ? "border-violet-400/40 bg-violet-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/25 hover:text-white"
              }`}
            >
              <span className="block text-sm font-medium">All</span>
              <span className="mt-1 block text-xs text-white/45">
                {selectedProjectNotes.length} saved
              </span>
            </button>

            {noteTypeSummaries.map((noteType) => (
              <button
                key={noteType.name}
                type="button"
                onClick={() => setActiveNoteType(noteType.name)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  activeNoteType === noteType.name
                    ? "border-violet-400/40 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/25 hover:text-white"
                }`}
              >
                <span className="block truncate text-sm font-medium">
                  {noteType.name}
                </span>
                <span className="mt-1 block text-xs text-white/45">
                  {noteType.count} saved
                </span>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSaveNote}
            className="mb-5 rounded-2xl border border-white/10 bg-black/15 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-white/60">
                Title
                <input
                  value={noteForm.title}
                  onChange={(event) => updateNoteForm("title", event.target.value)}
                  placeholder="Brand voice notes"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60">
                Type
                <input
                  list="vault-note-types"
                  value={noteForm.noteType}
                  onChange={(event) =>
                    updateNoteForm("noteType", event.target.value)
                  }
                  placeholder="Useful Prompts"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
                <datalist id="vault-note-types">
                  {noteTypeSummaries.map((noteType) => (
                    <option key={noteType.name} value={noteType.name} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-2">
                Project
                <select
                  value={noteForm.projectId}
                  onChange={(event) =>
                    updateNoteForm("projectId", event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  <option value={GLOBAL_PROJECT_ID}>Global - show everywhere</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.parent_project_id ? "  - " : ""}
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-2">
                Note
                <textarea
                  value={noteForm.content}
                  onChange={(event) =>
                    updateNoteForm("content", event.target.value)
                  }
                  placeholder="Add the thing future-you will be grateful to find."
                  rows={5}
                  className="resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/45">
                {editingNoteId ? "Editing a saved note." : "Add a reusable note block."}
              </p>

              <div className="flex flex-wrap gap-2">
                {editingNoteId ? (
                  <button
                    type="button"
                    onClick={() => resetNoteForm()}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={savingNote}
                  className="rounded-xl border border-violet-300/20 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingNote
                    ? "Saving..."
                    : editingNoteId
                      ? "Save changes"
                      : "Add note"}
                </button>
              </div>
            </div>

            {noteStatusMessage ? (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  noteStatusType === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                }`}
              >
                {noteStatusMessage}
              </div>
            ) : null}
          </form>

          {loadingNotes ? (
            <p className="text-sm text-white/60">Loading important notes...</p>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white">No notes saved yet.</p>
              <p className="mt-1 text-sm text-white/60">
                Add the first note block you want nearby.
              </p>
            </div>
          ) : visibleNotes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white">
                Nothing saved for {selectedProject.name} in {activeNoteType} yet.
              </p>
              <p className="mt-1 text-sm text-white/60">
                Add a note here when this project needs one.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleNotes.map((note) => {
                const noteProject = note.project_id
                  ? projects.find((project) => project.id === note.project_id)
                  : null;

                return (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                  >
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-200/80">
                        {note.note_type}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/50">
                        {noteProject?.name ?? "Global"}
                      </span>
                      {note.is_pinned ? (
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-100/80">
                          Pinned
                        </span>
                      ) : null}
                    </div>

                    <h4 className="text-xl text-white">{note.title}</h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/62">
                      {note.content}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleNotePin(note)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        {note.is_pinned ? "Unpin" : "Pin"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditingNote(note)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note)}
                        className="rounded-xl border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-sm text-rose-200/80 transition hover:bg-rose-500/15 hover:text-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl text-white md:text-2xl">Vault Links</h2>
              <p className="mt-2 text-sm text-white/60">
                Save the tools, folders, dashboards, and admin spots you reach
                for often.
              </p>
            </div>

            <button
              type="button"
              onClick={() => resetLinkForm()}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:border-violet-400/30 hover:text-white"
            >
              New link
            </button>
          </div>

          <div className="mb-5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-violet-300/80">
                  Project focus
                </p>
                <h3 className="mt-2 text-xl text-white">
                  {selectedProject.name}
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  Showing {globalLinkCount} global link
                  {globalLinkCount === 1 ? "" : "s"} plus {selectedProjectOwnLinkCount}
                  project link{selectedProjectOwnLinkCount === 1 ? "" : "s"}.
                </p>
              </div>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:min-w-72">
                Choose project
                <select
                  value={selectedProjectId}
                  onChange={(event) => updateLinkProject(event.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.parent_project_id ? "  - " : ""}
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveSection("All")}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                activeSection === "All"
                  ? "border-violet-400/40 bg-violet-500/15 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/25 hover:text-white"
              }`}
            >
              <span className="block text-sm font-medium">All</span>
              <span className="mt-1 block text-xs text-white/45">
                {selectedProjectLinks.length} saved
              </span>
            </button>

            {sectionSummaries.map((section) => (
              <button
                key={section.name}
                type="button"
                onClick={() => setActiveSection(section.name)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  activeSection === section.name
                    ? "border-violet-400/40 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/25 hover:text-white"
                }`}
              >
                <span className="block truncate text-sm font-medium">
                  {section.name}
                </span>
                <span className="mt-1 block text-xs text-white/45">
                  {section.count} saved
                </span>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSaveLink}
            className="mb-5 rounded-2xl border border-white/10 bg-black/15 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-[1fr_10rem]">
              <label className="flex flex-col gap-2 text-sm text-white/60">
                Label
                <input
                  value={linkForm.label}
                  onChange={(event) => updateLinkForm("label", event.target.value)}
                  placeholder="Google Drive Vault"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60">
                Section
                <input
                  list="vault-link-sections"
                  value={linkForm.category}
                  onChange={(event) =>
                    updateLinkForm("category", event.target.value)
                  }
                  placeholder="Business"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
                <datalist id="vault-link-sections">
                  {sectionSummaries.map((section) => (
                    <option key={section.name} value={section.name} />
                  ))}
                </datalist>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-2">
                Link
                <input
                  value={linkForm.href}
                  onChange={(event) => updateLinkForm("href", event.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-2">
                Project
                <select
                  value={linkForm.projectId}
                  onChange={(event) =>
                    updateLinkForm("projectId", event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
                >
                  <option value={GLOBAL_PROJECT_ID}>Global - show everywhere</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.parent_project_id ? "  - " : ""}
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-white/60 lg:col-span-2">
                Description
                <textarea
                  value={linkForm.description}
                  onChange={(event) =>
                    updateLinkForm("description", event.target.value)
                  }
                  placeholder="What is this for?"
                  rows={3}
                  className="resize-none rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/45">
                {editingLinkId ? "Editing a saved link." : "Add a new saved place."}
              </p>

              <div className="flex flex-wrap gap-2">
                {editingLinkId ? (
                  <button
                    type="button"
                    onClick={() => resetLinkForm()}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={savingLink}
                  className="rounded-xl border border-violet-300/20 bg-violet-500/15 px-4 py-2 text-sm text-violet-100 transition hover:bg-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingLink
                    ? "Saving..."
                    : editingLinkId
                      ? "Save changes"
                      : "Add link"}
                </button>
              </div>
            </div>

            {linkStatusMessage ? (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  linkStatusType === "success"
                    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-200"
                }`}
              >
                {linkStatusMessage}
              </div>
            ) : null}
          </form>

          {loadingLinks ? (
            <p className="text-sm text-white/60">Loading vault links...</p>
          ) : links.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white">No links saved yet.</p>
              <p className="mt-1 text-sm text-white/60">
                Add the first place you want nearby.
              </p>
            </div>
          ) : visibleLinks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-white">
                Nothing saved for {selectedProject.name} in {activeSection} yet.
              </p>
              <p className="mt-1 text-sm text-white/60">
                Add a link here when this project needs one.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedLinks.map((group) => (
                <div key={group.section}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg text-white">{group.section}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                      {group.links.length} saved
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {group.links.map((link) => {
                      const canOpen = link.href && link.href !== "#";
                      const linkProject = link.project_id
                        ? projects.find((project) => project.id === link.project_id)
                        : null;

                      return (
                        <div
                          key={link.id}
                          className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap gap-2">
                                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-xs text-violet-200/80">
                                  {link.category}
                                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/50">
                                  {linkProject?.name ?? "Global"}
                                </span>
                              </div>
                              <h4 className="truncate text-xl text-white">
                                {link.label}
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-white/60">
                                {link.description || "No description yet."}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {canOpen ? (
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-sm text-violet-200 transition hover:bg-violet-400/20"
                              >
                                Open
                              </a>
                            ) : (
                              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/40">
                                No URL yet
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => startEditingLink(link)}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLink(link)}
                              className="rounded-xl border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-sm text-rose-200/80 transition hover:bg-rose-500/15 hover:text-rose-100"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WhisperLayout>
  );
}











