export type Task = {
  id: string;
  title?: string;
  text?: string;
  description?: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  task_type?: string;
  source?: string;
  updated_at?: string;
};
