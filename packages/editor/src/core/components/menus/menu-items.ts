/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/react";
import { i18nInstance } from "@plane/i18n";
import {
  BoldIcon,
  Heading1,
  CheckSquare,
  Heading2,
  Heading3,
  TextQuote,
  ImageIcon,
  TableIcon,
  ListIcon,
  ListOrderedIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  Heading4,
  Heading5,
  Heading6,
  CaseSensitive,
  MinusSquare,
  Palette,
  AlignCenter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LinkIcon } from "@plane/propel/icons";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import {
  insertHorizontalRule,
  insertImage,
  insertTableCommand,
  setLinkEditor,
  setText,
  setTextAlign,
  toggleBackgroundColor,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCodeBlock,
  toggleHeading,
  toggleItalic,
  toggleOrderedList,
  toggleStrike,
  toggleTaskList,
  toggleTextColor,
  toggleUnderline,
  unsetLinkEditor,
} from "@/helpers/editor-commands";
// types
import type { TCommandWithProps, TEditorCommands } from "@/types";
import type { ISvgIcons } from "@plane/propel/icons";
type isActiveFunction<T extends TEditorCommands> = (params?: TCommandWithProps<T>) => boolean;
type commandFunction<T extends TEditorCommands> = (params?: TCommandWithProps<T>) => void;

const menuLabel = (key: string): string => String(i18nInstance.t(key));

export type EditorMenuItem<T extends TEditorCommands> = {
  key: T;
  name: string;
  command: commandFunction<T>;
  icon: LucideIcon | React.FC<ISvgIcons>;
  isActive: isActiveFunction<T>;
};

export const TextItem = (editor: Editor): EditorMenuItem<"text"> => ({
  key: "text",
  name: menuLabel("work_item_types.settings.properties.property_type.text.label"),
  isActive: () => editor.isActive(CORE_EXTENSIONS.PARAGRAPH),
  command: () => setText(editor),
  icon: CaseSensitive,
});

type SupportedHeadingLevels = Extract<TEditorCommands, "h1" | "h2" | "h3" | "h4" | "h5" | "h6">;

const HeadingItem = <T extends SupportedHeadingLevels>(
  editor: Editor,
  level: 1 | 2 | 3 | 4 | 5 | 6,
  key: T,
  nameTranslationKey: string,
  icon: LucideIcon
): EditorMenuItem<T> => ({
  key,
  name: menuLabel(nameTranslationKey),
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level }),
  command: () => toggleHeading(editor, level),
  icon,
});

export const HeadingOneItem = (editor: Editor): EditorMenuItem<"h1"> =>
  HeadingItem(editor, 1, "h1", "legacy_ui.heading_1", Heading1);

export const HeadingTwoItem = (editor: Editor): EditorMenuItem<"h2"> =>
  HeadingItem(editor, 2, "h2", "legacy_ui.heading_2", Heading2);

export const HeadingThreeItem = (editor: Editor): EditorMenuItem<"h3"> =>
  HeadingItem(editor, 3, "h3", "legacy_ui.heading_3", Heading3);

export const HeadingFourItem = (editor: Editor): EditorMenuItem<"h4"> =>
  HeadingItem(editor, 4, "h4", "legacy_ui.heading_4", Heading4);

export const HeadingFiveItem = (editor: Editor): EditorMenuItem<"h5"> =>
  HeadingItem(editor, 5, "h5", "legacy_ui.heading_5", Heading5);

export const HeadingSixItem = (editor: Editor): EditorMenuItem<"h6"> =>
  HeadingItem(editor, 6, "h6", "legacy_ui.heading_6", Heading6);

export const BoldItem = (editor: Editor): EditorMenuItem<"bold"> => ({
  key: "bold",
  name: menuLabel("legacy_ui.bold"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BOLD),
  command: () => toggleBold(editor),
  icon: BoldIcon,
});

export const ItalicItem = (editor: Editor): EditorMenuItem<"italic"> => ({
  key: "italic",
  name: menuLabel("legacy_ui.italic"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.ITALIC),
  command: () => toggleItalic(editor),
  icon: ItalicIcon,
});

export const UnderLineItem = (editor: Editor): EditorMenuItem<"underline"> => ({
  key: "underline",
  name: menuLabel("legacy_ui.underline"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.UNDERLINE),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon,
});

export const StrikeThroughItem = (editor: Editor): EditorMenuItem<"strikethrough"> => ({
  key: "strikethrough",
  name: menuLabel("legacy_ui.strikethrough"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.STRIKETHROUGH),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon,
});

export const BulletListItem = (editor: Editor): EditorMenuItem<"bulleted-list"> => ({
  key: "bulleted-list",
  name: menuLabel("legacy_ui.bulleted_list"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BULLET_LIST),
  command: () => toggleBulletList(editor),
  icon: ListIcon,
});

export const NumberedListItem = (editor: Editor): EditorMenuItem<"numbered-list"> => ({
  key: "numbered-list",
  name: menuLabel("legacy_ui.numbered_list"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.ORDERED_LIST),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon,
});

export const TodoListItem = (editor: Editor): EditorMenuItem<"to-do-list"> => ({
  key: "to-do-list",
  name: menuLabel("legacy_ui.to_do_list"),
  isActive: () => editor.isActive(CORE_EXTENSIONS.TASK_ITEM),
  command: () => toggleTaskList(editor),
  icon: CheckSquare,
});

export const QuoteItem = (editor: Editor): EditorMenuItem<"quote"> => ({
  key: "quote",
  name: menuLabel("legacy_ui.quote"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BLOCKQUOTE),
  command: () => toggleBlockquote(editor),
  icon: TextQuote,
});

export const CodeItem = (editor: Editor): EditorMenuItem<"code"> => ({
  key: "code",
  name: menuLabel("legacy_ui.code"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.CODE_INLINE) || editor?.isActive(CORE_EXTENSIONS.CODE_BLOCK),
  command: () => toggleCodeBlock(editor),
  icon: CodeIcon,
});

export const TableItem = (editor: Editor): EditorMenuItem<"table"> => ({
  key: "table",
  name: menuLabel("issue.layouts.spreadsheet"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.TABLE),
  command: () => insertTableCommand(editor),
  icon: TableIcon,
});

export const ImageItem = (editor: Editor): EditorMenuItem<"image"> => ({
  key: "image",
  name: menuLabel("legacy_ui.image"),
  isActive: () => editor?.isActive(CORE_EXTENSIONS.IMAGE) || editor?.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE),
  command: () => insertImage({ editor, event: "insert", pos: editor.state.selection.from }),
  icon: ImageIcon,
});

export const HorizontalRuleItem = (editor: Editor): EditorMenuItem<"divider"> =>
  ({
    key: "divider",
    name: menuLabel("legacy_ui.divider"),
    isActive: () => editor?.isActive(CORE_EXTENSIONS.HORIZONTAL_RULE),
    command: () => insertHorizontalRule(editor),
    icon: MinusSquare,
  }) as const;

export const LinkItem = (editor: Editor): EditorMenuItem<"link"> =>
  ({
    key: "link",
    name: menuLabel("common.link"),
    isActive: () => editor?.isActive("link"),

    command: (props) => {
      if (!props) return;
      if (props.url) setLinkEditor(editor, props.url, props.text);
      else unsetLinkEditor(editor);
    },

    icon: LinkIcon,
  }) as const;

export const TextColorItem = (editor: Editor): EditorMenuItem<"text-color"> => ({
  key: "text-color",
  name: menuLabel("legacy_ui.color"),
  isActive: (props) => editor.isActive(CORE_EXTENSIONS.CUSTOM_COLOR, { color: props?.color }),
  command: (props) => {
    if (!props) return;
    toggleTextColor(props.color, editor);
  },
  icon: Palette,
});

export const BackgroundColorItem = (editor: Editor): EditorMenuItem<"background-color"> => ({
  key: "background-color",
  name: menuLabel("background_color"),
  isActive: (props) => editor.isActive(CORE_EXTENSIONS.CUSTOM_COLOR, { backgroundColor: props?.color }),
  command: (props) => {
    if (!props) return;
    toggleBackgroundColor(props.color, editor);
  },
  icon: Palette,
});

export const TextAlignItem = (editor: Editor): EditorMenuItem<"text-align"> => ({
  key: "text-align",
  name: menuLabel("legacy_ui.text_align"),
  isActive: (props) => editor.isActive({ textAlign: props?.alignment }),
  command: (props) => {
    if (!props) return;
    setTextAlign(props.alignment, editor);
  },
  icon: AlignCenter,
});

export const getEditorMenuItems = (editor: Editor | null): EditorMenuItem<TEditorCommands>[] => {
  if (!editor) return [];

  return [
    TextItem(editor),
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    HeadingFourItem(editor),
    HeadingFiveItem(editor),
    HeadingSixItem(editor),
    BoldItem(editor),
    ItalicItem(editor),
    UnderLineItem(editor),
    StrikeThroughItem(editor),
    BulletListItem(editor),
    TodoListItem(editor),
    CodeItem(editor),
    NumberedListItem(editor),
    QuoteItem(editor),
    TableItem(editor),
    ImageItem(editor),
    HorizontalRuleItem(editor),
    LinkItem(editor),
    TextColorItem(editor),
    BackgroundColorItem(editor),
    TextAlignItem(editor),
  ] as EditorMenuItem<TEditorCommands>[];
};
