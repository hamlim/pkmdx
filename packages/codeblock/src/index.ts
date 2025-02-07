/// <reference lib="dom" />
import { type Node, createStyleTag, findChildren } from "@tiptap/core";
import type { CodeBlockOptions } from "@tiptap/extension-code-block";
import { CodeBlock } from "@tiptap/extension-code-block";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { DecorationAttrs } from "@tiptap/pm/view";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Element } from "hast";
import type {
  BundledLanguage,
  BundledTheme,
  HighlighterGeneric,
  StringLiteralUnion,
} from "shiki/bundle/web";
import {
  bundledLanguagesInfo,
  getHighlighter,
  getSingletonHighlighter,
} from "shiki/bundle/web";
// import style from "./index.css";

export interface CodeBlockShikiOptions extends CodeBlockOptions {
  theme: StringLiteralUnion<BundledTheme, string>;
}

export interface CodeBlockShikiStorage {
  highlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | null;
}

export const codeBlockShiki: Node<
  CodeBlockShikiOptions,
  CodeBlockShikiStorage
> = CodeBlock.extend<CodeBlockShikiOptions, CodeBlockShikiStorage>({
  addOptions() {
    return {
      ...this.parent?.(),
      theme: "vitesse-light",
    };
  },
  addStorage() {
    return {
      highlighter: null,
    };
  },
  async onBeforeCreate() {
    // createStyleTag(style, undefined, "code-block-shiki");
    this.storage.highlighter = await getSingletonHighlighter({
      themes: [this.options.theme],
      langs: bundledLanguagesInfo.map((item: any): any => item.id),
    });
  },
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: new PluginKey(this.name),
        state: {
          init: (_, { doc }) => {
            return getDecorations({
              doc,
              name: this.name,
              highlighter: this.storage.highlighter,
              theme: this.options.theme,
            });
          },
          apply: (transaction, decorationSet, oldState, newState) => {
            const oldNodeName = oldState.selection.$head.parent.type.name;
            const newNodeName = newState.selection.$head.parent.type.name;

            if (
              transaction.docChanged &&
              ([oldNodeName, newNodeName].includes(this.name) ||
                // only toggle language for code block
                // @ts-expect-error attr
                transaction.steps.find((item) => item.attr === "language"))
            ) {
              return getDecorations({
                doc: transaction.doc,
                name: this.name,
                highlighter: this.storage.highlighter,
                theme: this.options.theme,
              });
            }

            return decorationSet.map(transaction.mapping, transaction.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
  addNodeView() {
    return ({ editor, node, getPos, HTMLAttributes }) => {
      const dom = window.document.createElement("pre");
      dom.classList.add("note-editor__code-block-shiki");
      for (const key of Object.keys(HTMLAttributes)) {
        dom.setAttribute(key, HTMLAttributes[key]);
      }

      const content = window.document.createElement("code");
      const langClass = this.options.languageClassPrefix + node.attrs.language;
      content.classList.add(langClass);
      dom.append(content);

      if (this.editor.isEditable) {
        const selectLang = window.document.createElement("select");
        let classes =
          "absolute top-1 right-1 text-xs leading-4 cursor-pointer py-0.5 px-1 rounded border border-slate-100";
        for (let className of classes.split(" ")) {
          selectLang.classList.add(className);
        }
        selectLang.addEventListener("change", (event) => {
          // @ts-expect-error value
          const lang = event.target.value;
          editor.commands.command(({ tr }) => {
            const pos = (getPos as () => number)();
            tr.setNodeAttribute(pos, "language", lang);

            return true;
          });
        });
        const options = bundledLanguagesInfo.map((item) => {
          const option = document.createElement("option");
          option.setAttribute("value", item.id);
          if (
            node.attrs.language === item.id ||
            node.attrs.language === item.name ||
            item.aliases?.includes(node.attrs.language)
          )
            option.setAttribute("selected", "");

          option.textContent = item.id;
          return option;
        });
        selectLang.append(...options);
        dom.append(selectLang);
      } else {
        const langTag = window.document.createElement("div");
        langTag.classList.add(
          "note-editor__code-block-shiki__lang-tag absolute top-1 right-1 text-xs leading-4 py-0.5 px-1 rounded",
        );
        langTag.textContent = node.attrs.language ?? "text";
        dom.append(langTag);
      }

      return {
        dom,
        contentDOM: content,
      };
    };
  },
});

function formatLanguage(lang: string): null | undefined | string {
  if (!lang) return null;

  return bundledLanguagesInfo.find((item) => [
    item.id,
    item.name,
    ...(item.aliases ?? []),
  ])?.id;
}

function getDecorations({
  doc,
  name,
  highlighter,
  theme,
}: {
  doc: ProsemirrorNode;
  name: string;
  highlighter: CodeBlockShikiStorage["highlighter"];
  theme: CodeBlockShikiOptions["theme"];
}) {
  let decorations: Decoration[] = [];
  if (!highlighter) return DecorationSet.create(doc, decorations);

  for (const block of findChildren(doc, (node) => node.type.name === name)) {
    // @ts-expect-error language
    block.node.attrs.language =
      formatLanguage(block.node.attrs.language) ?? "text";

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const preNode = highlighter!.codeToHast(block.node.textContent, {
      theme,
      lang: block.node.attrs.language,
    }).children[0] as Element;

    decorations.push(
      Decoration.node(block.pos, block.pos + block.node.nodeSize, {
        class: `${preNode.properties?.class} relative rounded-[8px] py-[4px] px-[8px]`,
        style: preNode.properties?.style,
      } as DecorationAttrs),
    );

    let from = block.pos + 1;
    const lines = (preNode.children[0] as Element).children;
    for (const line of lines) {
      if ((line as Element).children?.length) {
        let lineFrom = from;
        // @ts-expect-error line type
        for (const node of line.children) {
          const nodeLen = node.children[0].value.length;
          decorations.push(
            Decoration.inline(
              lineFrom,
              lineFrom + nodeLen,
              (node as Element).properties as DecorationAttrs,
            ),
          );
          lineFrom += nodeLen;
        }

        // prosemirror do not support add wrap for line
        // decorations.push(Decoration.inline(from, lineFrom, line.properties as DecorationAttrs))
        from = lineFrom;
      } else if (line.type === "text") {
        from += line.value.length;
      }
    }
  }

  decorations = decorations.filter((item) => !!item);

  return DecorationSet.create(doc, decorations);
}
