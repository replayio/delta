import { atom } from "jotai";

// Create your atoms and derivatives
export const comparisonModeAtom = atom("slider");
export const snapshotsModeAtom = atom("changed");
export const themeAtom = atom("light");
export const themeEnabledAtom = atom(false);
