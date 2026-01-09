"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { MessageSquare, Code2 } from "lucide-react";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const ChatPanel = (
    <div className="h-full grid grid-rows-[auto_1fr] bg-white">
      {/* Chat Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-neutral-200/60">
        <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
          React Component Generator
        </h1>
        {isMobile && <HeaderActions user={user} projectId={project?.id} />}
      </div>

      {/* Chat Content */}
      <div className="h-full overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );

  const WorkbenchPanel = (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar */}
      <div className="h-14 border-b border-neutral-200/60 px-6 flex items-center justify-between bg-neutral-50/50">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as "preview" | "code")}
        >
          <TabsList className="bg-white/60 border border-neutral-200/60 p-0.5 h-9 shadow-sm">
            <TabsTrigger
              value="preview"
              className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-600 px-4 py-1.5 text-sm font-medium transition-all"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <HeaderActions user={user} projectId={project?.id} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-neutral-50">
        {activeView === "preview" ? (
          <div className="h-full bg-white">
            <PreviewFrame />
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* File Tree */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full bg-neutral-50 border-r border-neutral-200">
                <FileTree />
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

            {/* Code Editor */}
            <ResizablePanel defaultSize={70}>
              <div className="h-full bg-white">
                <CodeEditor />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen overflow-hidden bg-neutral-50">
          {isMobile ? (
            <Tabs defaultValue="chat" className="h-full flex flex-col gap-0">
              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full m-0 data-[state=inactive]:hidden">
                  {ChatPanel}
                </TabsContent>
                <TabsContent value="workbench" className="h-full m-0 data-[state=inactive]:hidden">
                  {WorkbenchPanel}
                </TabsContent>
              </div>
              <TabsList className="h-16 w-full justify-evenly rounded-none border-t border-neutral-200 bg-white p-2">
                <TabsTrigger
                  value="chat"
                  className="flex flex-col items-center gap-1 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 text-neutral-500 rounded-md px-4 py-2 h-full flex-1"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-medium">Chat</span>
                </TabsTrigger>
                <TabsTrigger
                  value="workbench"
                  className="flex flex-col items-center gap-1 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 text-neutral-500 rounded-md px-4 py-2 h-full flex-1"
                >
                  <Code2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Workbench</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Left Panel - Chat */}
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                {ChatPanel}
              </ResizablePanel>

              <ResizableHandle className="w-[1px] bg-neutral-200 hover:bg-neutral-300 transition-colors" />

              {/* Right Panel - Preview/Code */}
              <ResizablePanel defaultSize={65}>{WorkbenchPanel}</ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
