import { SlashCmd, createSuggestionsItems } from "@harshtalks/slash-tiptap";
// import { useEditor } from "@tiptap/react";

export let suggestions = createSuggestionsItems([
  {
    title: "text",
    searchTerms: ["paragraph"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .run();
    },
  },
  {
    title: "Bullet List",
    searchTerms: ["unordered", "point"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered List",
    searchTerms: ["ordered", "point", "numbers"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Details",
    searchTerms: ["details", "summary"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: "paragraph", // Insert an empty paragraph first
          attrs: {
            class: "p-2 rounded bg-gray-100",
          },
          content: [],
        })
        .run();

      // Get the position of the last inserted node (empty paragraph)
      let pos = editor.state.selection.$from.pos - 1; // Move before the empty paragraph

      editor
        .chain()
        .insertDetailsAt(pos, {
          rootAttributes: {
            attrs: {
              class: "p-2 rounded-2xl bg-gray-100",
            },
          },
          summaryAttributes: {
            content: [{ type: "text", text: "Summary" }],
            attrs: {
              class: "underline decoration-wavy text-decoration-gray-500",
            },
          },
          detailsAttributes: {
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Content" }],
              },
            ],
          },
        })
        // Get the current cursor position
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            // Move cursor to end of content
            const pos = tr.selection.$anchor.after();
            // @ts-expect-error
            tr.setSelection(tr.selection.constructor.near(tr.doc.resolve(pos)));
          }
          return true;
        })
        .focus()
        .run();
    },
  },
  {
    title: "Code Block",
    searchTerms: ["code", "block"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleCodeBlock({
          language: "tsx",
        })
        .run();
    },
  },
  {
    title: "Task List",
    searchTerms: ["task", "todo"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
]);

export function SlashImpl() {
  return (
    <SlashCmd.Root>
      <SlashCmd.Cmd>
        <SlashCmd.Empty>No commands available</SlashCmd.Empty>
        <SlashCmd.List>
          {suggestions.map((item) => {
            return (
              <SlashCmd.Item
                value={item.title}
                onCommand={(val) => {
                  item.command(val);
                }}
                key={item.title}
              >
                <p className="text-green-600">{item.title}</p>
              </SlashCmd.Item>
            );
          })}
        </SlashCmd.List>
      </SlashCmd.Cmd>
    </SlashCmd.Root>
  );
}
