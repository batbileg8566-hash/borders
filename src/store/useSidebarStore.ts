import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BorderCrossing, Direction } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GlobalFilter {
  goodId: string | null;
  direction: Direction;
}

interface SidebarState {
  // State
  selectedBorder: BorderCrossing | null;
  globalFilter: GlobalFilter;
  expandedSection: "goods" | "ports" | null;
  isCollapsed: boolean;
  activeTab: "info" | "goods" | "dev";
  distanceMode: "ub" | "aimag" | null;

  // Actions
  setSelectedBorder: (border: BorderCrossing | null) => void;
  setGlobalFilter: (filter: Partial<GlobalFilter>) => void;
  clearFilter: () => void;
  toggleSection: (id: "goods" | "ports") => void;
  setExpandedSection: (id: "goods" | "ports" | null) => void;
  setIsCollapsed: (v: boolean) => void;
  setActiveTab: (tab: "info" | "goods" | "dev") => void;
  setDistanceMode: (mode: "ub" | "aimag" | null) => void;
  reset: () => void;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState = {
  selectedBorder: null,
  globalFilter: { goodId: null, direction: "import" as Direction },
  expandedSection: "goods" as const,
  isCollapsed: false,
  activeTab: "info" as const,
  distanceMode: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSidebarStore = create<SidebarState>()(
  devtools(
    (set) => ({
      ...initialState,

      setSelectedBorder: (border) =>
        set(
          { selectedBorder: border, activeTab: "info" },
          false,
          "setSelectedBorder"
        ),

      setGlobalFilter: (filter) =>
        set(
          (state) => ({
            globalFilter: { ...state.globalFilter, ...filter },
          }),
          false,
          "setGlobalFilter"
        ),

      clearFilter: () =>
        set(
          { globalFilter: { goodId: null, direction: "import" } },
          false,
          "clearFilter"
        ),

      toggleSection: (id) =>
        set(
          (state) => ({
            expandedSection: state.expandedSection === id ? null : id,
          }),
          false,
          "toggleSection"
        ),

      setExpandedSection: (id) =>
        set({ expandedSection: id }, false, "setExpandedSection"),

      setIsCollapsed: (v) =>
        set({ isCollapsed: v }, false, "setIsCollapsed"),

      setActiveTab: (tab) =>
        set({ activeTab: tab }, false, "setActiveTab"),

      setDistanceMode: (mode) =>
        set({ distanceMode: mode }, false, "setDistanceMode"),

      reset: () => set(initialState, false, "reset"),
    }),
    { name: "SidebarStore" }
  )
);

// ─── State selectors ──────────────────────────────────────────────────────────

export const useSelectedBorder = () =>
  useSidebarStore((s) => s.selectedBorder);

export const useGlobalFilter = () =>
  useSidebarStore((s) => s.globalFilter);

export const useExpandedSection = () =>
  useSidebarStore((s) => s.expandedSection);

export const useIsCollapsed = () =>
  useSidebarStore((s) => s.isCollapsed);

export const useActiveTab = () =>
  useSidebarStore((s) => s.activeTab);

export const useDistanceMode = () =>
  useSidebarStore((s) => s.distanceMode);

// ─── Action selectors ─────────────────────────────────────────────────────────

export const useSetSelectedBorder = () =>
  useSidebarStore((s) => s.setSelectedBorder);

export const useSetGlobalFilter = () =>
  useSidebarStore((s) => s.setGlobalFilter);

export const useClearFilter = () =>
  useSidebarStore((s) => s.clearFilter);

export const useToggleSection = () =>
  useSidebarStore((s) => s.toggleSection);

export const useSetExpandedSection = () =>
  useSidebarStore((s) => s.setExpandedSection);

export const useSetIsCollapsed = () =>
  useSidebarStore((s) => s.setIsCollapsed);

export const useSetActiveTab = () =>
  useSidebarStore((s) => s.setActiveTab);

export const useSetDistanceMode = () =>
  useSidebarStore((s) => s.setDistanceMode);

export const useReset = () =>
  useSidebarStore((s) => s.reset);
