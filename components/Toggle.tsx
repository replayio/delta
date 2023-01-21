import { DarkModeSwitch } from "react-toggle-dark-mode";
import { useAtom } from "jotai";

import {
  comparisonModeAtom,
  themeAtom,
  themeEnabledAtom,
} from "../lib/client/state";
import Icon from "./Icon";
import { ReactNode } from "react";

function ToggleButton({
  icon,
  isSelected,
  label,
  onToggle,
}: {
  icon: ReactNode;
  isSelected: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex flex-row items-center justify-center cursor-pointer h-8 px-4 gap-1 ${
        isSelected
          ? "text-white bg-violet-500"
          : "text-slate-500 bg-slate-200 hover:bg-slate-200"
      } `}
      onClick={onToggle}
    >
      <div className="text-sm">{label}</div>
      {icon}
    </div>
  );
}
export function Toggle() {
  const [mode, setMode] = useAtom(comparisonModeAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const [themeEnabled] = useAtom(themeEnabledAtom);

  return (
    <div className="flex flex-row items-center">
      <div className="flex gap-px rounded overflow-hidden">
        <ToggleButton
          icon={<Icon className="fill-current h-6 w-6" type="slider" />}
          isSelected={mode == "slider"}
          label="swipe"
          onToggle={() => setMode("slider")}
        />
        <ToggleButton
          icon={<Icon className="fill-current h-6 w-6" type="compare" />}
          isSelected={mode == "compare"}
          label="2-up"
          onToggle={() => setMode("compare")}
        />
        <ToggleButton
          icon={<Icon className="fill-current h-5 w-5" type="delta" />}
          isSelected={mode == "diff"}
          label="diff"
          onToggle={() => setMode("diff")}
        />
      </div>

      {themeEnabled && (
        <DarkModeSwitch
          className="ml-4"
          checked={theme == "dark"}
          onChange={() => setTheme(theme === "light" ? "dark" : "light")}
          size={20}
          moonColor="#9DA9BB"
          sunColor="#9DA9BB"
        />
      )}
    </div>
  );
}
