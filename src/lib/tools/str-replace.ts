import { z } from "zod";
import { VirtualFileSystem } from "@/lib/file-system";

const TextEditorParameters = z.object({
  command: z.enum(["view", "create", "str_replace", "insert", "undo_edit"]),
  path: z.string().optional(),
  file_text: z.string().optional(),
  insert_line: z.number().optional(),
  new_str: z.string().optional(),
  old_str: z.string().optional(),
  view_range: z.array(z.number()).optional(),
});

export const buildStrReplaceTool = (fileSystem: VirtualFileSystem) => {
  return {
    id: "str_replace_editor" as const,
    args: {},
    parameters: TextEditorParameters,
    execute: async ({
      command,
      path,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    }: z.infer<typeof TextEditorParameters>) => {
      // Default path to /App.jsx if not provided
      const targetPath = path || "/App.jsx";

      switch (command) {
        case "view":
          return fileSystem.viewFile(
            targetPath,
            view_range as [number, number] | undefined
          );

        case "create":
          return fileSystem.createFileWithParents(targetPath, file_text || "");

        case "str_replace":
          return fileSystem.replaceInFile(targetPath, old_str || "", new_str || "");

        case "insert":
          return fileSystem.insertInFile(targetPath, insert_line || 0, new_str || "");

        case "undo_edit":
          return `Error: undo_edit command is not supported in this version. Use str_replace to revert changes.`;
      }
    },
  };
};
