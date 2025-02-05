/// <reference lib="dom" />
import { cn } from "@local/utils/cn";
import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface DetailsSummaryOptions {
  HTMLAttributes: Record<string, any>;
}

export let detailsSummary: Node<DetailsSummaryOptions> =
  Node.create<DetailsSummaryOptions>({
    name: "detailsSummary",
    group: "details",
    content: "inline*",
    addAttributes() {
      return {
        class: {
          default: "node-editor__details-summary",
          rendered: true,
          isRequired: false,
          parseHTML: (element) => element.getAttribute("class"),
          renderHTML: (attributes) => {
            if (attributes.class) {
              return {
                class: attributes.class,
              };
            }
            return {};
          },
        },
      };
    },
    addOptions() {
      return {
        HTMLAttributes: {},
      };
    },
    parseHTML() {
      return [
        {
          tag: "summary",
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "summary",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: cn("node-editor__details-summary", HTMLAttributes.class),
        }),
        0,
      ];
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey(this.name),
          props: {
            handleClickOn: (view, pos, node, nodePos, event, direct) => {
              if (!direct || node.type.name !== this.name) return;

              let detailsNode = view.state.doc.resolve(nodePos).parent;
              let tr = view.state.tr.setNodeAttribute(
                nodePos - 1,
                "open",
                !detailsNode.attrs.open,
              );
              view.dispatch(tr);
            },
          },
        }),
      ];
    },
  });

export interface DetailsContentOptions {
  HTMLAttributes: Record<string, any>;
}

export let detailsContent: Node<DetailsContentOptions> =
  Node.create<DetailsContentOptions>({
    name: "detailsContent",
    group: "details",
    content: "block*",
    addOptions() {
      return {
        attrs: {
          class: {
            default: "node-editor__details-content",
          },
        },
        HTMLAttributes: {},
      };
    },
    addAttributes() {
      return {
        class: {
          default: "node-editor__details-content",
          rendered: true,
          isRequired: false,
          parseHTML: (element) => element.getAttribute("class"),
          renderHTML: (attributes) => {
            if (attributes.class) {
              return {
                class: attributes.class,
              };
            }
            return {};
          },
        },
      };
    },
    parseHTML() {
      return [
        {
          tag: "div.node-editor__details-content",
        },
      ];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: cn("node-editor__details-content", HTMLAttributes.class),
        }),
        0,
      ];
    },
  });

export interface DetailsOptions {
  HTMLAttributes: Record<string, any>;
  detailSummaryOptions: Partial<DetailsSummaryOptions>;
  detailContentOptions: Partial<DetailsContentOptions>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    details: {
      insertDetails: ({
        summaryAttributes,
        detailsAttributes,
        rootAttributes,
      }: {
        summaryAttributes?: Record<string, any>;
        detailsAttributes?: Record<string, any>;
        rootAttributes?: Record<string, any>;
      }) => ReturnType;
      insertDetailsAt: (
        pos: number,
        {
          summaryAttributes,
          detailsAttributes,
          rootAttributes,
        }: {
          summaryAttributes?: Record<string, any>;
          detailsAttributes?: Record<string, any>;
          rootAttributes?: Record<string, any>;
        },
      ) => ReturnType;
    };
  }
}

export let details: Node<DetailsOptions> = Node.create<DetailsOptions>({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  addOptions() {
    return {
      attrs: {
        class: {
          default: "node-editor__details",
        },
      },
      HTMLAttributes: {},
      detailSummaryOptions: {},
      detailContentOptions: {},
    };
  },
  addAttributes() {
    return {
      class: {
        default: "node-editor__details",
        rendered: true,
        isRequired: false,
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (attributes.class) {
            return {
              class: attributes.class,
            };
          }
          return {};
        },
      },
      open: {
        default: null,
        rendered: true,
        isRequired: true,
        parseHTML: (element) => element.getAttribute("open"),
        renderHTML: (attributes) => {
          if (attributes.open) {
            return {
              open: true,
            };
          }

          return {};
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "details",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: cn("node-editor__details", HTMLAttributes.class),
      }),
      0,
    ];
  },
  addCommands() {
    return {
      insertDetails:
        ({ summaryAttributes, detailsAttributes, rootAttributes }) =>
        ({ commands }) => {
          commands.insertContent({
            type: this.name,
            ...rootAttributes,
            content: [
              {
                type: detailsSummary.name,
                ...summaryAttributes,
              },
              {
                type: detailsContent.name,
                ...detailsAttributes,
              },
            ],
          });

          return true;
        },
      insertDetailsAt:
        (pos, { summaryAttributes, detailsAttributes, rootAttributes }) =>
        ({ commands }) =>
          commands.insertContentAt(pos, {
            type: this.name,
            ...rootAttributes,
            content: [
              {
                type: detailsSummary.name,
                ...summaryAttributes,
              },
              {
                type: detailsContent.name,
                ...detailsAttributes,
              },
            ],
          }),
    };
  },
  addExtensions() {
    return [
      detailsSummary.configure(this.options.detailSummaryOptions),
      detailsContent.configure(this.options.detailContentOptions),
    ];
  },
});
