/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Disclosure, Transition } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import {
  CalendarLayoutIcon,
  ChevronRightIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  TimelineLayoutIcon,
} from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import useLocalStorage from "@/hooks/use-local-storage";

const studioItems = [
  { key: "today", i18nKey: "studio.navigation.today", href: "", icon: HomeIcon },
  { key: "portfolio", i18nKey: "studio.navigation.portfolio", href: "/studio/portfolio", icon: LayersIcon },
  { key: "operations", i18nKey: "studio.navigation.operations", href: "/studio/operations", icon: InboxIcon },
  { key: "timeline", i18nKey: "studio.navigation.timeline", href: "/studio/timeline", icon: TimelineLayoutIcon },
  { key: "review", i18nKey: "studio.navigation.review", href: "/studio/review", icon: CalendarLayoutIcon },
] as const;

export function StudioWorkspaceNavigation() {
  const { workspaceSlug: workspaceSlugParam } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  const workspaceSlug = workspaceSlugParam?.toString() ?? "";
  const { toggleSidebar, isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();
  const { storedValue: isOpen, setValue: setIsOpen } = useLocalStorage<boolean>("is_studio_menu_open", true);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
    if (isExtendedSidebarOpened) toggleExtendedSidebar(false);
  };

  return (
    <Disclosure as="div" className="flex flex-col" defaultOpen={!!isOpen}>
      <div className="group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-placeholder hover:bg-layer-transparent-hover">
        <Disclosure.Button
          type="button"
          className="flex w-full items-center gap-1 text-left text-13 font-semibold whitespace-nowrap text-placeholder"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t("studio.navigation.collapse_aria") : t("studio.navigation.expand_aria")}
        >
          <span>{t("studio.navigation.studio")}</span>
        </Disclosure.Button>
        <Disclosure.Button
          type="button"
          className="flex-shrink-0 rounded-sm p-0.5 opacity-0 group-hover:opacity-100 hover:bg-layer-1 focus:opacity-100"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? t("studio.navigation.collapse_aria") : t("studio.navigation.expand_aria")}
        >
          <ChevronRightIcon className={cn("size-3 transition-transform", { "rotate-90": isOpen })} />
        </Disclosure.Button>
      </div>
      <Transition
        show={!!isOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isOpen && (
          <Disclosure.Panel static className="flex flex-col gap-0.5">
            {studioItems.map((item) => {
              const href = `/${workspaceSlug}${item.href}`;
              const isActive =
                item.key === "today" ? pathname === href || pathname === `${href}/` : pathname.startsWith(href);
              return (
                <Link key={item.key} href={href} onClick={handleLinkClick}>
                  <SidebarNavItem isActive={isActive}>
                    <div className="flex items-center gap-1.5 py-[1px]">
                      <item.icon className="size-4 flex-shrink-0" />
                      <span className="text-13 leading-5 font-medium">{t(item.i18nKey)}</span>
                    </div>
                  </SidebarNavItem>
                </Link>
              );
            })}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
}
