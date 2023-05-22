import { Menu, Transition } from "@headlessui/react";
import { FormEventHandler, Fragment, ReactNode } from "react";
import classNames from "../utils/classNames";

type Option = {
  isSelected: Boolean;
  key: string;
  render: (isActive: boolean) => ReactNode;
};

export default function Dropdown({
  align,
  onChange,
  options,
  selected,
}: {
  align: "left" | "right";
  onChange?: FormEventHandler<HTMLButtonElement>;
  options: Option[];
  selected: string;
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          onChange={onChange}
          className="inline-flex text-violet-500 w-full justify-center rounded-md items-center py-2 text-md hover:underline focus:outline-none "
        >
          {selected}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute z-10 w-56 flex flex-col truncate origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {options.map((option) => (
            <Menu.Item key={option.key}>
              {({ active }) => (
                <div
                  className={classNames(
                    active || option.isSelected
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700",
                    "block px-4 py-2 text-sm"
                  )}
                >
                  {option.render(active)}
                </div>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
