import { supabase } from "./supabase";

export async function getTasks() {
  const { data, error } = await supabase.from("tasks").select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
