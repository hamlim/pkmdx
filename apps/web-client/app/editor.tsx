import EditorJS from "@editorjs/editorjs";
import { useEffect } from "react";

let editorInstance: EditorJS | null = null;

function initEditor() {
  if (!editorInstance) {
    editorInstance = new EditorJS({
      holder: "editor",
    });
  }
}

export function Editor() {
  useEffect(() => {
    initEditor();
  }, []);

  return <div id="editor" />;
}
