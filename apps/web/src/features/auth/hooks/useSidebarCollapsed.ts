"use client";

import { useCallback, useSyncExternalStore } from "react";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "engvocab.sidebar.collapsed";

const sidebarCollapsedListeners = new Set<() => void>();

function subscribeSidebarCollapsed(listener: () => void) {
  sidebarCollapsedListeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === SIDEBAR_COLLAPSED_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    sidebarCollapsedListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSidebarCollapsedSnapshot() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}

function emitSidebarCollapsedChange() {
  sidebarCollapsedListeners.forEach((listener) => {
    listener();
  });
}

export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );

  const setCollapsed = useCallback((value: boolean) => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(value));
    emitSidebarCollapsedChange();
  }, []);

  return { collapsed, setCollapsed };
}
