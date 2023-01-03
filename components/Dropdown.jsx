import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Dropdown({ selected, options, onChange, project }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          onChange={onChange}
          className="inline-flex w-full justify-center rounded-md items-center py-2 text-md hover:underline text-gray-700 focus:outline-none "
        >
          {selected}
          {/* <ChevronDownIcon className="ml-1 h-5 w-5" aria-hidden="true" /> */}
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
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 flex flex-col truncate origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {options.map((option) => (
            <Menu.Item key={option.name}>
              {({ active }) => (
                <a
                  href={`/project/${project.short}/?branch=${option.name}`}
                  //   onClick={() => onChange(option)}
                  className={classNames(
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                    "block px-4 py-2 text-sm  "
                  )}
                >
                  <div className="flex justify-between w-full">
                    <div className="truncate pr-4">{option.name}</div>
                    {
                      <div className="bg-violet-500 px-2 rounded text-white text-xs font-bold flex items-center">
                        {option.action_status != "neutral"
                          ? option.num_snapshots_changed
                          : "-"}
                      </div>
                    }
                  </div>
                </a>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
