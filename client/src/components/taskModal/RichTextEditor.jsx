import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Unlink2,
  Code2,
  Highlighter,
} from "lucide-react";

import ToolbarButton from "./ToolbarButton";

export default function RichTextEditor({
  content,
  onChange,
}) {
  const getUrlFromUser = (message, currentValue = "") => {
    const url = window.prompt(message, currentValue);

    if (url === null) return null;

    return url.trim();
  };

  const isValidUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Underline,
      Highlight,
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: ({ editor }) => {
    return editor.isEmpty ? "Describe your task..." : "";
  },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],

    content: content || "",

    editorProps: {
      attributes: {
        class:
          "rich-text-editor min-h-[250px] max-h-[250px] overflow-y-auto p-4 focus:outline-none text-neutral-300",
      },
    },

    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const runCommand = useCallback(
    (command) => {
      if (!editor) return;

      command(editor.chain().focus()).run();
    },
    [editor]
  );

  const canRun = useCallback(
    (command) => {
      if (!editor) return false;

      return command(editor.can().chain().focus()).run();
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const currentUrl = editor.getAttributes("link").href || "";
    const url = getUrlFromUser("Enter URL", currentUrl);

    if (url === null) return;

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    if (!isValidUrl(url)) {
      window.alert("Please enter a valid http or https URL.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  useEffect(() => {
    if (
      editor &&
      content !== editor.getHTML()
    ) {
      editor.commands.setContent(
        content || "",
        false
      );
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[#222429] rounded-xl bg-[#121316] overflow-hidden">

      {/* Toolbar */}
      <div className=" flex flex-wrap items-center gap-1 p-3 bg-[#17181c] border-b border-[#222429]">
        <ToolbarButton
          title="Undo"
          disabled={!canRun((chain) => chain.undo())}
          onClick={() => runCommand((chain) => chain.undo())}
        >
          <Undo2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Redo"
          disabled={!canRun((chain) => chain.redo())}
          onClick={() => runCommand((chain) => chain.redo())}
        >
          <Redo2 size={18} />
        </ToolbarButton>

        {/* Heading */}
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          disabled={!canRun((chain) => chain.toggleHeading({ level: 1 }))}
          onClick={() => runCommand((chain) => chain.toggleHeading({ level: 1 }))}
        >
          <Heading1 size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          disabled={!canRun((chain) => chain.toggleHeading({ level: 2 }))}
          onClick={() => runCommand((chain) => chain.toggleHeading({ level: 2 }))}
        >
          <Heading2 size={18} />
        </ToolbarButton>

        {/* Text Formatting */}
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          disabled={!canRun((chain) => chain.toggleBold())}
          onClick={() => runCommand((chain) => chain.toggleBold())}
        >
          <Bold size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          disabled={!canRun((chain) => chain.toggleItalic())}
          onClick={() => runCommand((chain) => chain.toggleItalic())}
        >
          <Italic size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          disabled={!canRun((chain) => chain.toggleUnderline())}
          onClick={() => runCommand((chain) => chain.toggleUnderline())}
        >
          <UnderlineIcon size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Highlight"
          active={editor.isActive("highlight")}
          disabled={!canRun((chain) => chain.toggleHighlight())}
          onClick={() => runCommand((chain) => chain.toggleHighlight())}
        >
          <Highlighter size={18} />
        </ToolbarButton>

        {/*  Lists */}
        <ToolbarButton
          title="Bullet List"
          active={editor.isActive("bulletList")}
          disabled={!canRun((chain) => chain.toggleBulletList())}
          onClick={() => runCommand((chain) => chain.toggleBulletList())}
        >
          <List size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Ordered List"
          active={editor.isActive("orderedList")}
          disabled={!canRun((chain) => chain.toggleOrderedList())}
          onClick={() => runCommand((chain) => chain.toggleOrderedList())}
        >
          <ListOrdered size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Checklist"
          active={editor.isActive("taskList")}
          disabled={!canRun((chain) => chain.toggleTaskList())}
          onClick={() => runCommand((chain) => chain.toggleTaskList())}
        >
          <CheckSquare size={18} />
        </ToolbarButton>

        {/* Alignment */}
        <ToolbarButton
          title="Align Left"
          active={editor.isActive({ textAlign: "left" })}
          disabled={!canRun((chain) => chain.setTextAlign("left"))}
          onClick={() => runCommand((chain) => chain.setTextAlign("left"))}
        >
          <AlignLeft size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Align Center"
          active={editor.isActive({ textAlign: "center" })}
          disabled={!canRun((chain) => chain.setTextAlign("center"))}
          onClick={() => runCommand((chain) => chain.setTextAlign("center"))}
        >
          <AlignCenter size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Align Right"
          active={editor.isActive({ textAlign: "right" })}
          disabled={!canRun((chain) => chain.setTextAlign("right"))}
          onClick={() => runCommand((chain) => chain.setTextAlign("right"))}
        >
          <AlignRight size={18} />
        </ToolbarButton>

        {/* Links, Codes*/}
        <ToolbarButton
          title="Link"
          active={editor.isActive("link")}
          disabled={!canRun((chain) => chain.setLink({ href: "https://example.com" }))}
          onClick={setLink}
        >
          <Link2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Remove Link"
          disabled={!editor.isActive("link")}
          onClick={() => runCommand((chain) => chain.unsetLink())}
        >
          <Unlink2 size={18} />
        </ToolbarButton>

        <ToolbarButton
          title="Code Block"
          active={editor.isActive("codeBlock")}
          disabled={!canRun((chain) => chain.toggleCodeBlock())}
          onClick={() => runCommand((chain) => chain.toggleCodeBlock())}
        >
          <Code2 size={18} />
        </ToolbarButton>

      </div>

      <EditorContent editor={editor} />

    </div>
  );
}
