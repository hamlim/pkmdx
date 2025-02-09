import { findChildren } from "@tiptap/core";
import CodeBlock, { type CodeBlockOptions } from "@tiptap/extension-code-block";
import type { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type PluginView } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import {
  type BundledLanguage,
  type BundledTheme,
  type Highlighter,
  bundledLanguages,
  bundledThemes,
  createHighlighter,
} from "shiki";

let highlighter: Highlighter | undefined;
let highlighterPromise: Promise<void> | undefined;
let loadingLanguages = new Set<BundledLanguage>();
let loadingThemes = new Set<BundledTheme>();

type HighlighterOptions = {
  themes: (BundledTheme | null | undefined)[];
  languages: (BundledLanguage | null | undefined)[];
};

export function resetHighlighter() {
  highlighter = undefined;
  highlighterPromise = undefined;
  loadingLanguages.clear();
  loadingThemes.clear();
}

export function getShiki() {
  return highlighter;
}

/**
 * Load the highlighter. Makes sure the highlighter is only loaded once.
 */
export function loadHighlighter(opts: HighlighterOptions) {
  if (!highlighter && !highlighterPromise) {
    let themes = opts.themes.filter(
      (theme): theme is BundledTheme => !!theme && theme in bundledThemes,
    );
    let langs = opts.languages.filter(
      (lang): lang is BundledLanguage => !!lang && lang in bundledLanguages,
    );
    highlighterPromise = createHighlighter({ themes, langs }).then((h) => {
      highlighter = h;
    });
    return highlighterPromise;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }
}

/**
 * Loads a theme if it's valid and not yet loaded.
 * @returns true or false depending on if it got loaded.
 */
export async function loadTheme(theme: BundledTheme) {
  if (
    highlighter &&
    !highlighter.getLoadedThemes().includes(theme) &&
    !loadingThemes.has(theme) &&
    theme in bundledThemes
  ) {
    loadingThemes.add(theme);
    await highlighter.loadTheme(theme);
    loadingThemes.delete(theme);
    return true;
  }

  return false;
}

/**
 * Loads a language if it's valid and not yet loaded
 * @returns true or false depending on if it got loaded.
 */
export async function loadLanguage(language: BundledLanguage) {
  if (
    highlighter &&
    !highlighter.getLoadedLanguages().includes(language) &&
    !loadingLanguages.has(language) &&
    language in bundledLanguages
  ) {
    loadingLanguages.add(language);
    await highlighter.loadLanguage(language);
    loadingLanguages.delete(language);
    return true;
  }

  return false;
}

/**
 * Initializes the highlighter based on the prosemirror document,
 * with the themes and languages in the document.
 */
export async function initHighlighter({
  doc,
  name,
  defaultTheme,
  defaultLanguage,
}: {
  doc: ProsemirrorNode;
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
}) {
  let codeBlocks = findChildren(doc, (node) => node.type.name === name);

  let themes = [
    ...codeBlocks.map((block) => block.node.attrs.theme as BundledTheme),
    defaultTheme,
  ];
  let languages = [
    ...codeBlocks.map((block) => block.node.attrs.language as BundledLanguage),
    defaultLanguage,
  ];

  if (!highlighter) {
    let loader = loadHighlighter({ languages, themes });
    await loader;
  } else {
    await Promise.all([
      ...themes.flatMap((theme) => loadTheme(theme)),
      ...languages.flatMap((language) => !!language && loadLanguage(language)),
    ]);
  }
}

/** Create code decorations for the current document */
function getDecorations({
  doc,
  name,
  defaultTheme,
  defaultLanguage,
}: {
  doc: ProsemirrorNode;
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
}) {
  let decorations: Decoration[] = [];

  let codeBlocks = findChildren(doc, (node) => node.type.name === name);

  for (let block of codeBlocks) {
    let from = block.pos + 1;
    let language = block.node.attrs.language || defaultLanguage;
    let theme = block.node.attrs.theme || defaultTheme;

    let highlighter = getShiki();

    if (!highlighter) return;

    if (!highlighter.getLoadedLanguages().includes(language)) {
      language = "plaintext";
    }

    let themeToApply = highlighter.getLoadedThemes().includes(theme)
      ? theme
      : highlighter.getLoadedThemes()[0];

    let tokens = highlighter.codeToTokensBase(block.node.textContent, {
      lang: language,
      theme: themeToApply,
    });

    for (let line of tokens) {
      for (let token of line) {
        let to = from + token.content.length;

        let decoration = Decoration.inline(from, to, {
          style: `color: ${token.color}`,
        });

        decorations.push(decoration);

        from = to;
      }

      from += 1;
    }
  }

  return DecorationSet.create(doc, decorations);
}

export function ShikiPlugin({
  name,
  defaultLanguage,
  defaultTheme,
}: {
  name: string;
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
}) {
  let shikiPlugin: Plugin<any> = new Plugin({
    key: new PluginKey("shiki"),

    view(view) {
      // This small view is just for initial async handling
      class ShikiPluginView implements PluginView {
        constructor() {
          this.initDecorations();
        }

        update() {
          this.checkUndecoratedBlocks();
        }
        destroy() {}

        // Initialize shiki async, and then highlight initial document
        async initDecorations() {
          let doc = view.state.doc;
          await initHighlighter({ doc, name, defaultLanguage, defaultTheme });
          let tr = view.state.tr.setMeta("shikiPluginForceDecoration", true);
          view.dispatch(tr);
        }

        // When new codeblocks were added and they have missing themes or
        // languages, load those and then add code decorations once again.
        async checkUndecoratedBlocks() {
          let codeBlocks = findChildren(
            view.state.doc,
            (node) => node.type.name === name,
          );

          // Load missing themes or languages when necessary.
          // loadStates is an array with booleans depending on if a theme/lang
          // got loaded.
          let loadStates = await Promise.all(
            codeBlocks.flatMap((block) => [
              loadTheme(block.node.attrs.theme),
              loadLanguage(block.node.attrs.language),
            ]),
          );
          let didLoadSomething = loadStates.includes(true);

          // The asynchronous nature of this is potentially prone to
          // race conditions. Imma just hope it's fine lol

          if (didLoadSomething) {
            let tr = view.state.tr.setMeta("shikiPluginForceDecoration", true);
            view.dispatch(tr);
          }
        }
      }

      return new ShikiPluginView();
    },

    state: {
      init: (_, { doc }) => {
        return getDecorations({
          doc,
          name,
          defaultLanguage,
          defaultTheme,
        });
      },
      apply: (transaction, decorationSet, oldState, newState) => {
        let oldNodeName = oldState.selection.$head.parent.type.name;
        let newNodeName = newState.selection.$head.parent.type.name;
        let oldNodes = findChildren(
          oldState.doc,
          (node) => node.type.name === name,
        );
        let newNodes = findChildren(
          newState.doc,
          (node) => node.type.name === name,
        );

        let didChangeSomeCodeBlock =
          transaction.docChanged &&
          // Apply decorations if:
          // selection includes named node,
          ([oldNodeName, newNodeName].includes(name) ||
            // OR transaction adds/removes named node,
            newNodes.length !== oldNodes.length ||
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            transaction.steps.some((step) => {
              // @ts-ignore
              return (
                // @ts-ignore
                step.from !== undefined &&
                // @ts-ignore
                step.to !== undefined &&
                oldNodes.some((node) => {
                  // @ts-ignore
                  return (
                    // @ts-ignore
                    node.pos >= step.from &&
                    // @ts-ignore
                    node.pos + node.node.nodeSize <= step.to
                  );
                })
              );
            }));

        // only create code decoration when it's necessary to do so
        if (
          transaction.getMeta("shikiPluginForceDecoration") ||
          didChangeSomeCodeBlock
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            defaultLanguage,
            defaultTheme,
          });
        }

        return decorationSet.map(transaction.mapping, transaction.doc);
      },
    },

    props: {
      decorations(state) {
        return shikiPlugin.getState(state);
      },
    },
  });

  return shikiPlugin;
}

export interface CodeBlockShikiOptions extends CodeBlockOptions {
  defaultLanguage: BundledLanguage | null | undefined;
  defaultTheme: BundledTheme;
}

export let CodeBlockShiki = CodeBlock.extend<CodeBlockShikiOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      defaultLanguage: null,
      defaultTheme: "github-dark",
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      ShikiPlugin({
        name: this.name,
        defaultLanguage: this.options.defaultLanguage,
        defaultTheme: this.options.defaultTheme,
      }),
    ];
  },
});
