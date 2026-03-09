export type Task = {
  id: number;
  text: string;
  category: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
};
