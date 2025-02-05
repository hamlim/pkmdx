import {
  Slash,
  SlashCmdProvider,
  enableKeyboardNavigation,
} from "@harshtalks/slash-tiptap";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
// src/Tiptap.tsx
import {
  BubbleMenu,
  EditorProvider,
  type EditorProviderProps,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Details, DetailsSummary } from "./details";
import { SlashImpl, suggestions } from "./slash";
import "./editor.css";

// define your extension array
let extensions = [
  StarterKit,
  Highlight,
  Typography,
  Details,
  DetailsSummary,
  Slash.configure({
    suggestion: {
      items() {
        return suggestions;
      },
    },
  }),
];

let editorProps: EditorProviderProps["editorProps"] = {
  handleDOMEvents: {
    keydown(_, event) {
      return enableKeyboardNavigation(event);
    },
  },
};

let content = "<p>Hello World!</p>";

export function Editor() {
  return (
    <SlashCmdProvider>
      <EditorProvider
        extensions={extensions}
        content={content}
        editorProps={editorProps}
      >
        {/* <FloatingMenu editor={null}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={null}>This is the bubble menu</BubbleMenu> */}
        <SlashImpl />
      </EditorProvider>
    </SlashCmdProvider>
  );
}
