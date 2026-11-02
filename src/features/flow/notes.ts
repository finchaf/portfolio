/** The notes of the vault in the order of its tree. A note's text is `messages/<locale>/vault/<id>.md`. */
export const FOLDERS = {
  process: ["stage-1", "stage-2", "edits", "continue", "done"],
  quality: ["checklists", "rules", "critic", "audit"],
  task: ["brief", "research", "style", "screens", "decisions", "state"],
  results: ["results"],
} as const;

export type FolderId = keyof typeof FOLDERS;

export const MAIN_NOTE = "flow";

export const NOTE_IDS = [MAIN_NOTE, ...Object.values(FOLDERS).flat()] as string[];

export const TASK_NOTES: readonly string[] = FOLDERS.task;

export function folderOf(id: string): FolderId | undefined {
  return (Object.keys(FOLDERS) as FolderId[]).find((folder) =>
    (FOLDERS[folder] as readonly string[]).includes(id),
  );
}
