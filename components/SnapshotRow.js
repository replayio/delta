export function SnapshotRow({ snapshot, onSelect, index, selectedSnapshot }) {
  const filename = snapshot.file?.split("/").pop();
  const isSelected = snapshot.id === selectedSnapshot?.id;
  const status = !snapshot.mainSnapshot
    ? "new"
    : snapshot.primary_changed
    ? "different"
    : "same";

  const bgColor =
    status === "new" ? "green" : status === "same" ? "blue" : "red";

  return (
    <div
      className={`flex items-center text-black cursor-pointer hover:bg-slate-100
      
      ${isSelected ? "bg-slate-100" : ""}`}
      onClick={() => onSelect(index)}
      key={snapshot.id}
    >
      <div
        style={{
          backgroundColor: bgColor,
          width: "5px",
          height: "5px",
          borderRadius: "5px",
          marginRight: "10px",
        }}
      ></div>
      {filename}
    </div>
  );
}
