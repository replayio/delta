import { atom } from "jotai";

export type ComparisonMode = "compare" | "diff" | "slider";
export type Theme = "dark" | "light";

// Create your atoms and derivatives
export const comparisonModeAtom = atom<ComparisonMode>("slider");
export const themeAtom = atom<Theme>("light");
export const themeEnabledAtom = atom<boolean>(false);
