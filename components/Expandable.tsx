import {
  KeyboardEvent,
  MouseEvent,
  unstable_Offscreen as Offscreen,
  ReactNode,
  useState,
  useTransition,
} from "react";
import Icon from "./Icon";

export default function Expandable({
  content,
  className = "",
  defaultOpen = false,
  header,
}: {
  content: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  header: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    event.stopPropagation();

    if (isPending) {
      return;
    }

    const newIsOpen = !isOpen;

    // In case this change triggers a re-render that suspends, it should be in a transition.
    startTransition(() => {
      setIsOpen(newIsOpen);
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
      case "NumpadEnter":
      case " ":
        event.stopPropagation();

        const newIsOpen = !isOpen;

        // In case this change triggers a re-render that suspends, it should be in a transition.
        startTransition(() => {
          setIsOpen(newIsOpen);
        });
        break;
    }
  };

  return (
    <>
      <div
        className={className}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
      >
        <Icon
          className={`shrink-0 w-4 h-4 transition ${isOpen ? "rotate-90" : ""}`}
          type="arrow"
        />
        {header}
      </div>

      <Offscreen mode={isOpen ? "visible" : "hidden"}>{content}</Offscreen>
    </>
  );
}
