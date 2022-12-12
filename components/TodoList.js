import { useState, useEffect } from "react";
import { supabase } from "../lib/initSupabase";

export default function Todos({ user }) {
  const [todos, setTodos] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [errorText, setError] = useState("");
  const [snapshot, setSnapshot] = useState();
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => fetchSnapshots(), []);
  useEffect(() => fetchSnapshot(), [snapshotIndex, snapshots]);

  console.log({ snapshots, snapshotIndex, snapshot });
  const path = "12-11-2022--5:31/test/fixtures/console.ts-snapshots/dark";
  const fetchSnapshots = async () => {
    if (!user) return;
    const { data, error } = await supabase.storage
      .from("snapshots")
      .list(`${user.id}/${path}`, {
        // path: "12-11-2022--5:31/test/fixtures/console.ts-snapshots/dark",
        limit: 100,
        // search: "12-11-2022--5:31",
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.log("error", { error, data });
      return;
    }

    setSnapshots(data);
  };

  const fetchSnapshot = async () => {
    if (!snapshots || snapshots.length == 0) return;

    const { data: image, error: imageError } = await supabase.storage
      .from("snapshots")
      .download(`${user.id}/${path}/${snapshots[snapshotIndex]?.name}`);

    if (imageError) {
      console.log("error", imageError);
      return;
    }
    setSnapshot(image);
    console.log(image, imageError);
  };

  return (
    <div className="w-full h-full">
      {snapshots && (
        <div
          // style={{ height: "500px", maxHeight: "500px" }}
          className="my-2  text-white flex flex-col items-center"
        >
          <div className="mb-6">
            <button
              onClick={() => setSnapshotIndex(snapshotIndex - 1)}
              className="mr-1"
            >
              Prev
            </button>
            ({snapshotIndex + 1}/{snapshots.length + 1})
            <button
              onClick={() => setSnapshotIndex(snapshotIndex + 1)}
              className="ml-1"
            >
              Next
            </button>
          </div>
          <div>{snapshot && <img src={URL.createObjectURL(snapshot)} />}</div>
        </div>
      )}
    </div>
  );
}
