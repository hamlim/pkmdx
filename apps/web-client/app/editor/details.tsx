import { Node, type NodeViewProps, mergeAttributes } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { useEffect, useRef } from "react";

function DetailsView(props: NodeViewProps) {
  return (
    <NodeViewWrapper className="details-node">
      <details>
        <summary>
          <NodeViewContent
            className="details-summary"
            as="span"
            data-type="summary"
          />
        </summary>
        <NodeViewContent className="details-content" data-type="content" />
      </details>
    </NodeViewWrapper>
  );
}

export let Details = Node.create({
  name: "react-details",
  group: "block",
  content: "summary block+", // Allow summary and one or more blocks
  defining: true, // This helps with proper nesting

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: (attributes) => {
          if (!attributes.open) {
            return {};
          }
          return { open: "open" };
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
    return ["details", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DetailsView);
  },
});

// Add this as a separate node for the summary
export const DetailsSummary = Node.create({
  name: "summary",
  content: "inline*",
  parseHTML() {
    return [{ tag: "summary" }];
  },
  renderHTML() {
    return ["summary", 0];
  },
  selectable: true,
  draggable: false,
});
