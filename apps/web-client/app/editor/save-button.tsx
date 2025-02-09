import { useCurrentEditor } from "@tiptap/react";

export function SaveButton() {
  let { editor } = useCurrentEditor();
  return (
    <button
      type="button"
      onClick={() => {
        let content = editor?.getJSON();
        console.log(content);
      }}
    >
      Save
    </button>
  );
}
