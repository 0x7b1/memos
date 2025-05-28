import { StrudelMirror } from "@strudel/codemirror";
import { silence } from "@strudel/core";
import { transpiler } from "@strudel/transpiler";
import {
  getAudioContext,
  initAudioOnFirstClick,
  webaudioOutput,
  registerSynthSounds,
  registerZZFXSounds,
  samples,
} from "@strudel/webaudio";
import { PauseIcon, PlayIcon, RefreshCcwIcon, SaveIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/utils";

export const soundMap = new Map();

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

// TODO: add sound bank for default drum kit
async function prebake() {
  await Promise.all([
    registerSynthSounds(),
    registerZZFXSounds(),
    import("@strudel/soundfonts").then(({ registerSoundfonts }) => registerSoundfonts()),
    samples(`${baseNoTrailing}/piano.json`, undefined, { prebake: true }),
    samples(`${baseNoTrailing}/vcsl.json`, "github:sgossner/VCSL/master/", { prebake: true }),
    samples(`${baseNoTrailing}/tidal-drum-machines.json`, "github:ritchse/tidal-drum-machines/main/machines/", {
      prebake: true,
      tag: "drum-machines",
    }),
  ]);
}

const evalScope = async (...args) => {
  const results = await Promise.allSettled(args);
  const modules = results.filter((result) => result.status === "fulfilled").map((r) => r.value);
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.warn(`evalScope: module with index ${i} could not be loaded:`, result.reason);
    }
  });

  modules.forEach((module) => {
    Object.entries(module).forEach(([name, value]) => {
      globalThis[name] = value;
    });
  });

  return modules;
};

function loadModules() {
  const modules = [
    import("@strudel/core"),
    import("@strudel/tonal"),
    import("@strudel/mini"),
    import("@strudel/webaudio"),
    import("@strudel/codemirror"),
  ];

  return evalScope(...modules);
}

let prebaked, modulesLoading, audioReady;
if (typeof window !== "undefined") {
  prebaked = prebake();
  modulesLoading = loadModules();
  audioReady = initAudioOnFirstClick();
}

interface StrudelReplProps {
  theme: string;
  tune: string;
  hideHeader: boolean;
  onTrigger: (pat: any) => any;
  onSave: (code: string) => void;
}

interface StrudelReplState {
  started: boolean;
  isDirty: boolean;
  error: any;
}

export function StrudelRepl({ theme, tune, hideHeader = false, onTrigger, onSave, maxHeight }: StrudelReplProps) {
  const [replState, setReplState] = useState<StrudelReplState>({
    started: false,
    isDirty: false,
    error: null,
  });
  const { started, isDirty, error } = replState;
  const editorRef = useRef();
  const containerRef = useRef();

  const init = useCallback((code) => {
    const editor = new StrudelMirror({
      defaultOutput: webaudioOutput,
      getTime: () => getAudioContext().currentTime,
      transpiler,
      root: containerRef.current,
      initialCode: "// LOADING",
      pattern: silence,
      editPattern: (pat, id) => {
        if (onTrigger) {
          pat = pat.onTrigger(onTrigger, false);
        }

        return pat;
      },
      prebake: async () => Promise.all([modulesLoading, prebaked]),
      onUpdateState: (state) => {
        console.log("onUpdateState", state);
        setReplState({ ...state });
      },
      onToggle: (playing) => {
        console.log("onToggle", playing);
      },
      beforeStart: () => audioReady,
    });
    editor.setCode(code);
    editor.setFontSize(14);
    editor.setFontFamily("Input Mono Condensed");
    editor.setTheme(theme);
    editor.setLineNumbersDisplayed(false);
    editor.setLineWrappingEnabled(false);

    editorRef.current = editor;
  }, []);

  return (
    <div className="overflow-hidden rounded-md bg-background border border-gray-200 dark:border-gray-900">
      {!hideHeader && (
        <div className="flex justify-between bg-lineHighlight">
          <div className="flex">
            <button
              className={cn(
                "cursor-pointer w-12 flex items-center justify-center p-1 border-r border-lineHighlight text-foreground bg-lineHighlight dark:border-gray-900 hover:bg-background",
                started ? "animate-pulse" : "",
              )}
              aria-label={started ? "stop" : "play"}
              onClick={() => editorRef.current?.toggle()}
            >
              {started ? <PauseIcon className="w-4 h-auto" /> : <PlayIcon className="w-4 h-auto" />}
            </button>
            <button
              className={cn(
                "w-12 flex items-center justify-center p-1 text-foreground border-lineHighlight bg-lineHighlight dark:border-gray-900",
                isDirty ? "text-foreground hover:bg-background cursor-pointer" : "opacity-50 cursor-not-allowed",
              )}
              aria-label="update"
              onClick={() => editorRef.current?.evaluate()}
            >
              <RefreshCcwIcon className="w-4 h-auto" />
            </button>
          </div>
          <div className="flex">
            <button
              className={cn(
                "w-12 flex items-center justify-center text-foreground bg-lineHighlight dark:border-gray-900",
                isDirty ? "text-foreground hover:bg-background cursor-pointer" : "opacity-50 cursor-not-allowed",
              )}
              aria-label="previous example"
              disabled={!isDirty}
              onClick={() => {
                const code = editorRef.current?.code;
                onSave(code);
              }}
            >
              <SaveIcon className="w-4 h-auto" />
            </button>
          </div>
        </div>
      )}
      <div className="overflow-auto relative p-0" style={maxHeight ? { maxHeight: `${maxHeight}px` } : {}}>
        <div
          ref={(el) => {
            if (!editorRef.current) {
              containerRef.current = el;
              init(tune);
            }
          }}
        ></div>
        {error && <div className="text-right p-1 text-md text-red-200">{error.message}</div>}
      </div>
    </div>
  );
}
