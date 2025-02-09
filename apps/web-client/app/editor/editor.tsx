import {
  Slash,
  SlashCmdProvider,
  enableKeyboardNavigation,
} from "@harshtalks/slash-tiptap";
import { details } from "@local/details-extension";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import {
  BubbleMenu,
  EditorProvider,
  type EditorProviderProps,
  FloatingMenu,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { SlashImpl, suggestions } from "./slash";
import "./editor.css";
// import { codeBlockShiki } from "@local/codeblock-extension";
// import { CodeBlockShiki } from "@local/codeblock-extension";
import CodeBlockShiki from "tiptap-extension-code-block-shiki";

// define your extension array
let extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  Highlight,
  Typography,
  details,
  CodeBlockShiki.configure({
    defaultTheme: "vitesse-light",
    defaultLanguage: "tsx",
    HTMLAttributes: {
      class: "rounded-md m-2 border border-gray-200 p-2",
    },
  }),
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
