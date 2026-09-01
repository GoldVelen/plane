/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Strikethrough,
  Table,
  TextQuote,
  Underline,
} from "lucide-react";
import { MonospaceIcon, SansSerifIcon, SerifIcon } from "@plane/propel/icons";
import type { TCommandExtraProps, TEditorCommands, TEditorFontStyle } from "@/types";

export type TEditorTypes = "lite" | "document" | "sticky";

// Utility type to enforce the necessary extra props or make extraProps optional
export type ExtraPropsForCommand<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? TCommandExtraProps[T]
  : object; // Default to empty object for commands without extra props

export type ToolbarMenuItem<T extends TEditorCommands = TEditorCommands> = {
  itemKey: T;
  renderKey: string;
  name: string;
  nameTranslationKey: string;
  icon: LucideIcon;
  shortcut?: string[];
  editors: TEditorTypes[];
  extraProps?: ExtraPropsForCommand<T>;
};

export const TYPOGRAPHY_ITEMS: ToolbarMenuItem<"text" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6">[] = [
  {
    itemKey: "text",
    renderKey: "text",
    name: "Text",
    nameTranslationKey: "work_item_types.settings.properties.property_type.text.label",
    icon: CaseSensitive,
    editors: ["document"],
  },
  {
    itemKey: "h1",
    renderKey: "h1",
    name: "Heading 1",
    nameTranslationKey: "legacy_ui.heading_1",
    icon: Heading1,
    editors: ["document"],
  },
  {
    itemKey: "h2",
    renderKey: "h2",
    name: "Heading 2",
    nameTranslationKey: "legacy_ui.heading_2",
    icon: Heading2,
    editors: ["document"],
  },
  {
    itemKey: "h3",
    renderKey: "h3",
    name: "Heading 3",
    nameTranslationKey: "legacy_ui.heading_3",
    icon: Heading3,
    editors: ["document"],
  },
  {
    itemKey: "h4",
    renderKey: "h4",
    name: "Heading 4",
    nameTranslationKey: "legacy_ui.heading_4",
    icon: Heading4,
    editors: ["document"],
  },
  {
    itemKey: "h5",
    renderKey: "h5",
    name: "Heading 5",
    nameTranslationKey: "legacy_ui.heading_5",
    icon: Heading5,
    editors: ["document"],
  },
  {
    itemKey: "h6",
    renderKey: "h6",
    name: "Heading 6",
    nameTranslationKey: "legacy_ui.heading_6",
    icon: Heading6,
    editors: ["document"],
  },
];

export const TEXT_ALIGNMENT_ITEMS: ToolbarMenuItem<"text-align">[] = [
  {
    itemKey: "text-align",
    renderKey: "text-align-left",
    name: "Left align",
    nameTranslationKey: "legacy_ui.left_align",
    icon: AlignLeft,
    shortcut: ["Cmd", "Shift", "L"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "left",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-center",
    name: "Center align",
    nameTranslationKey: "legacy_ui.center_align",
    icon: AlignCenter,
    shortcut: ["Cmd", "Shift", "E"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "center",
    },
  },
  {
    itemKey: "text-align",
    renderKey: "text-align-right",
    name: "Right align",
    nameTranslationKey: "legacy_ui.right_align",
    icon: AlignRight,
    shortcut: ["Cmd", "Shift", "R"],
    editors: ["lite", "document"],
    extraProps: {
      alignment: "right",
    },
  },
];

const BASIC_MARK_ITEMS: ToolbarMenuItem<"bold" | "italic" | "underline" | "strikethrough">[] = [
  {
    itemKey: "bold",
    renderKey: "bold",
    name: "Bold",
    nameTranslationKey: "legacy_ui.bold",
    icon: Bold,
    shortcut: ["Cmd", "B"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "italic",
    renderKey: "italic",
    name: "Italic",
    nameTranslationKey: "legacy_ui.italic",
    icon: Italic,
    shortcut: ["Cmd", "I"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "underline",
    renderKey: "underline",
    name: "Underline",
    nameTranslationKey: "legacy_ui.underline",
    icon: Underline,
    shortcut: ["Cmd", "U"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "strikethrough",
    renderKey: "strikethrough",
    name: "Strikethrough",
    nameTranslationKey: "legacy_ui.strikethrough",
    icon: Strikethrough,
    shortcut: ["Cmd", "Shift", "S"],
    editors: ["lite", "document"],
  },
];

const LIST_ITEMS: ToolbarMenuItem<"bulleted-list" | "numbered-list" | "to-do-list">[] = [
  {
    itemKey: "bulleted-list",
    renderKey: "bulleted-list",
    name: "Bulleted list",
    nameTranslationKey: "legacy_ui.bulleted_list",
    icon: List,
    shortcut: ["Cmd", "Shift", "7"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "numbered-list",
    renderKey: "numbered-list",
    name: "Numbered list",
    nameTranslationKey: "legacy_ui.numbered_list",
    icon: ListOrdered,
    shortcut: ["Cmd", "Shift", "8"],
    editors: ["lite", "document"],
  },
  {
    itemKey: "to-do-list",
    renderKey: "to-do-list",
    name: "To-do list",
    nameTranslationKey: "legacy_ui.to_do_list",
    icon: ListTodo,
    shortcut: ["Cmd", "Shift", "9"],
    editors: ["lite", "document"],
  },
];

export const USER_ACTION_ITEMS: ToolbarMenuItem<"quote" | "code">[] = [
  {
    itemKey: "quote",
    renderKey: "quote",
    name: "Quote",
    nameTranslationKey: "legacy_ui.quote",
    icon: TextQuote,
    editors: ["lite", "document"],
  },
  {
    itemKey: "code",
    renderKey: "code",
    name: "Code",
    nameTranslationKey: "legacy_ui.code",
    icon: Code2,
    editors: ["lite", "document"],
  },
];

export const COMPLEX_ITEMS: ToolbarMenuItem<"table" | "image">[] = [
  {
    itemKey: "table",
    renderKey: "table",
    name: "Table",
    nameTranslationKey: "issue.layouts.spreadsheet",
    icon: Table,
    editors: ["document"],
  },
  {
    itemKey: "image",
    renderKey: "image",
    name: "Image",
    nameTranslationKey: "legacy_ui.image",
    icon: Image,
    editors: ["lite", "document"],
  },
];

export const IMAGE_ITEM = COMPLEX_ITEMS.find((item): item is ToolbarMenuItem<"image"> => item.itemKey === "image")!;

export const TOOLBAR_ITEMS: {
  [editorType in TEditorTypes]: {
    [key: string]: ToolbarMenuItem[];
  };
} = {
  lite: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("lite")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("lite")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("lite")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("lite")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("lite")),
  },
  document: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("document")),
    alignment: TEXT_ALIGNMENT_ITEMS.filter((item) => item.editors.includes("document")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("document")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("document")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("document")),
  },
  sticky: {
    basic: BASIC_MARK_ITEMS.filter((item) => ["bold", "italic"].includes(item.itemKey)),
    list: LIST_ITEMS.filter((item) => ["to-do-list"].includes(item.itemKey)),
  },
};

export const COLORS_LIST: {
  key: string;
  labelKey: string;
  textColor: string;
  backgroundColor: string;
}[] = [
  {
    key: "gray",
    labelKey: "legacy_ui.gray",
    textColor: "var(--editor-colors-gray-text)",
    backgroundColor: "var(--editor-colors-gray-background)",
  },
  {
    key: "peach",
    labelKey: "legacy_ui.peach",
    textColor: "var(--editor-colors-peach-text)",
    backgroundColor: "var(--editor-colors-peach-background)",
  },
  {
    key: "pink",
    labelKey: "legacy_ui.pink",
    textColor: "var(--editor-colors-pink-text)",
    backgroundColor: "var(--editor-colors-pink-background)",
  },
  {
    key: "orange",
    labelKey: "legacy_ui.orange",
    textColor: "var(--editor-colors-orange-text)",
    backgroundColor: "var(--editor-colors-orange-background)",
  },
  {
    key: "green",
    labelKey: "legacy_ui.green",
    textColor: "var(--editor-colors-green-text)",
    backgroundColor: "var(--editor-colors-green-background)",
  },
  {
    key: "light-blue",
    labelKey: "legacy_ui.light_blue",
    textColor: "var(--editor-colors-light-blue-text)",
    backgroundColor: "var(--editor-colors-light-blue-background)",
  },
  {
    key: "dark-blue",
    labelKey: "legacy_ui.dark_blue",
    textColor: "var(--editor-colors-dark-blue-text)",
    backgroundColor: "var(--editor-colors-dark-blue-background)",
  },
  {
    key: "purple",
    labelKey: "legacy_ui.purple",
    textColor: "var(--editor-colors-purple-text)",
    backgroundColor: "var(--editor-colors-purple-background)",
  },
  // {
  //   key: "pink-blue-gradient",
  //   label: "Pink blue gradient",
  //   textColor: "var(--editor-colors-pink-blue-gradient-text)",
  //   backgroundColor: "var(--editor-colors-pink-blue-gradient-background)",
  // },
];

export const EDITOR_FONT_STYLES: {
  key: TEditorFontStyle;
  labelKey: string;
  icon: React.FC;
}[] = [
  { key: "sans-serif", labelKey: "legacy_ui.sans_serif", icon: SansSerifIcon },
  { key: "serif", labelKey: "legacy_ui.serif", icon: SerifIcon },
  { key: "monospace", labelKey: "legacy_ui.mono", icon: MonospaceIcon },
];
