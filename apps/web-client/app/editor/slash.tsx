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
          type: "react-details",
          attrs: {
            open: true,
          },
          content: [
            {
              type: "summary",
              content: [
                {
                  type: "text",
                  text: "Summary",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Content",
                },
              ],
            },
          ],
        })
        .run();
      editor.commands.focus();
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
                <p>{item.title}</p>
              </SlashCmd.Item>
            );
          })}
        </SlashCmd.List>
      </SlashCmd.Cmd>
    </SlashCmd.Root>
  );
}
