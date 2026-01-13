import type { FileNode } from "@/lib/file-system";
import { VirtualFileSystem } from "@/lib/file-system";
import { streamText, appendResponseMessages } from "ai";
import { buildStrReplaceTool } from "@/lib/tools/str-replace";
import { buildFileManagerTool } from "@/lib/tools/file-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLanguageModel } from "@/lib/provider";
import { generationPrompt } from "@/lib/prompts/generation";

import { reviewCode } from "@/lib/agents/code-reviewer";

export async function POST(req: Request) {
  const {
    messages,
    files,
    projectId,
  }: { messages: any[]; files: Record<string, FileNode>; projectId?: string } =
    await req.json();

  messages.unshift({
    role: "system",
    content: generationPrompt,
  });

  // Reconstruct the VirtualFileSystem from serialized data
  const fileSystem = new VirtualFileSystem();
  fileSystem.deserializeFromNodes(files);

  const model = getLanguageModel();
  // Use fewer steps for mock provider to prevent repetition
  const isMockProvider = !process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // Custom tool wrapper to enforce limits and safety
  const baseEditorTool = buildStrReplaceTool(fileSystem);
  let editCount = 0;
  const MAX_EDITS = 3;

  const filteredMessagesForModel = messages.filter(
    (m) => m.content || m.tool_calls
  );

  const result = streamText({
    model,
    messages: filteredMessagesForModel,
    maxTokens: 10_000,
    maxSteps: isMockProvider ? 4 : 40,
    onError: (err: any) => {
      console.error("Stream error:", err);
    },
    tools: {
      str_replace_editor: {
        description: "A tool for viewing, creating, and editing files. Use 'create' to overwrite entire files.",
        parameters: baseEditorTool.parameters,
        execute: async (args: any, context) => {
          if (args.command === "str_replace") {
            return "ERROR: The 'str_replace' command is disabled for safety. You MUST use the 'create' command to overwrite the entire file with the new content.";
          }
          if (args.command === "create") {
            // Check limit BEFORE execution to prevent overwriting with hallucinated content
            if (editCount >= MAX_EDITS) {
              return `SYSTEM NOTICE: Maximum refinement steps (${MAX_EDITS}) reached. You MUST STOP now. Do not generate any more code.`;
            }

            editCount++;

            // Execute the file creation first
            const toolResult = await baseEditorTool.execute(args);

            // Extract the user prompt to give context to the reviewer
            // Filter out system messages and get the last user message
            const lastUserMessage = messages.slice().reverse().find(m => m.role === "user");
            const userRequest = lastUserMessage?.content || "Create a component";

            // Call the Critic Agent with timeout
            try {
              // Create a timeout promise
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Review timeout")), 25000)
              );

              const reviewPromise = reviewCode(args.file_text || "", userRequest as string);

              // Use Promise.race to enforce timeout
              const review = await Promise.race([reviewPromise, timeoutPromise]) as any;

              if (review.approved) {
                return `${toolResult}\n\nReviewer Score: ${review.score}/10 (Approved). Feedback: ${review.feedback}. \nGreat job! You can stop now.`;
              } else {
                return `${toolResult}\n\nReviewer Score: ${review.score}/10 (Needs Improvement). Feedback: ${review.feedback}. \nPlease refine the code to address this feedback.`;
              }
            } catch (error) {
              console.error("Critic Agent failed or timed out:", error);
              // Return success even if critic fails, so we don't block the flow
              return toolResult;
            }
          }
          return baseEditorTool.execute(args);
        },
      },
      file_manager: buildFileManagerTool(fileSystem),
    },
    onFinish: async ({ response }) => {
      // Save to project if projectId is provided and user is authenticated
      if (projectId) {
        try {
          // Check if user is authenticated
          const session = await getSession();
          if (!session) {
            console.error("User not authenticated, cannot save project");
            return;
          }

          // Get the messages from the response
          const responseMessages = response.messages || [];
          // Combine original messages with response messages
          const filteredMessages = messages.filter(
            (m) => m.role !== "system" && (m.content || m.tool_calls)
          );
          const allMessages = appendResponseMessages({
            messages: [...filteredMessages],
            responseMessages,
          });

          await prisma.project.update({
            where: {
              id: projectId,
              userId: session.userId,
            },
            data: {
              messages: JSON.stringify(allMessages),
              data: JSON.stringify(fileSystem.serialize()),
            },
          });
        } catch (error) {
          console.error("Failed to save project data:", error);
        }
      }
    },
  });

  return result.toDataStreamResponse();
}

export const maxDuration = 120;
