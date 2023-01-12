import { DarkModeSwitch } from "react-toggle-dark-mode";
import { useAtom } from "jotai";

import { themeAtom, themeEnabledAtom } from "../lib/client/state";

function ToggleButton({ isSelected, onToggle, children }) {
  return (
    <div
      className={`flex justify-center cursor-pointer py-2 px-4 ${
        isSelected
          ? "fill-white bg-violet-500"
          : "fill-slate-500 hover:bg-slate-200"
      } `}
      onClick={onToggle}
    >
      {children}
    </div>
  );
}
export function Toggle({ mode, setMode }) {
  const [theme, setTheme] = useAtom(themeAtom);
  const [themeEnabled] = useAtom(themeEnabledAtom);
  return (
    <div className="flex flex-row items-center">
      <div className="flex justify-between bg-slate-100 rounded overflow-hidden">
        <ToggleButton
          isSelected={mode == "slider"}
          onToggle={() => setMode("slider")}
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18 4L14 0V3H7V5H14V8M4 6L0 10L4 14V11H11V9H4V6Z" />
          </svg>
        </ToggleButton>

        <ToggleButton
          isSelected={mode == "diff"}
          onToggle={() => setMode("diff")}
        >
          <svg
            width="15"
            height="12"
            viewBox="0 0 15 12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7.5 2.8275L12.2925 10.5H2.7075L7.5 2.8275ZM7.5 0L0 12H15" />
          </svg>
        </ToggleButton>
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
