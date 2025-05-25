import copy from "copy-to-clipboard";
import hljs from "highlight.js";
import { CopyIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useMemoStore } from "@/store/v1";
import { Memo } from "@/types/proto/api/v1/memo_service";
import { cn } from "@/utils";
import MermaidBlock from "./MermaidBlock";
import StrudelBlock from "./StrudelBlock";
import { BaseProps } from "./types";

// Special languages that are rendered differently.
enum SpecialLanguage {
  HTML = "__html",
  MERMAID = "mermaid",
  STRUDEL = "strudel",
}

interface Props extends BaseProps {
  language: string;
  content: string;
  memoName?: string;
}

const CodeBlock: React.FC<Props> = ({ language, content, memoName }: Props) => {
  const memoStore = useMemoStore();
  const formatedLanguage = useMemo(() => (language || "").toLowerCase() || "text", [language]);

  // Users can set Markdown code blocks as `__html` to render HTML directly.
  if (formatedLanguage === SpecialLanguage.HTML) {
    return (
      <div
        className="w-full overflow-auto !my-2"
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      />
    );
  } else if (formatedLanguage === SpecialLanguage.MERMAID) {
    return <MermaidBlock content={content} />;
  } else if (formatedLanguage === SpecialLanguage.STRUDEL) {
    return (
      <StrudelBlock
        content={content}
        onSave={async (code) => {
          if (!memoName) {
            // TODO: handle case where memoName is not provided
            console.error("memoName is not provided to CodeBlock for Strudel onSave");
            toast.error("Failed to save: memo identifier missing.");
            return;
          }
          const prevMemo = await memoStore.getOrFetchMemoByName(memoName);
          if (prevMemo) {
            const memoPatch: Partial<Memo> = {
              name: prevMemo.name,
              content: code,
            };
            await memoStore.updateMemo(memoPatch, ["content", "update_time"]);
            toast.success("Saved!");
          } else {
            toast.error("Failed to save: original memo not found.");
          }
        }}
      />
    );
  }

  const highlightedCode = useMemo(() => {
    try {
      const lang = hljs.getLanguage(formatedLanguage);
      if (lang) {
        return hljs.highlight(content, {
          language: formatedLanguage,
        }).value;
      }
    } catch {
      // Skip error and use default highlighted code.
    }

    // Escape any HTML entities when rendering original content.
    return Object.assign(document.createElement("span"), {
      textContent: content,
    }).innerHTML;
  }, [formatedLanguage, content]);

  const handleCopyButtonClick = useCallback(() => {
    copy(content);
    toast.success("Copied to clipboard!");
  }, [content]);

  return (
    <div className="w-full my-1 bg-amber-100 border-l-4 border-amber-400 rounded hover:shadow dark:bg-zinc-600 dark:border-zinc-400 relative">
      <div className="w-full px-2 py-1 flex flex-row justify-between items-center text-amber-500 dark:text-zinc-400">
        <span className="text-sm font-mono">{formatedLanguage}</span>
        <CopyIcon className="w-4 h-auto cursor-pointer hover:opacity-80" onClick={handleCopyButtonClick} />
      </div>

      <div className="overflow-auto">
        <pre className={cn("no-wrap overflow-auto", "w-full p-2 bg-amber-50 dark:bg-zinc-700 relative")}>
          <code
            className={cn(`language-${formatedLanguage}`, "block text-sm leading-5")}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          ></code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
