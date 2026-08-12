
const TaskCard = ({ task, onStatusChange, onClick }) => {
  const priorityStyles = {
    low: "text-emerald-600",
    medium: "text-amber-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  };

  const assignee = task.assignee;

  const assigneeName =
    typeof assignee === "object" ? assignee?.name : null;

  const assigneeEmail =
    typeof assignee === "object" ? assignee?.email : null;

  const assigneeAvatar =
    typeof assignee === "object" ? assignee?.avatar : null;

  const assigneeInitial =
    assigneeName?.charAt(0)?.toUpperCase() || "?";

  const dueDate = task.dueDate
    ? new Date(task.dueDate)
    : null;

  const isOverdue =
    dueDate &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate < new Date() &&
    task.status !== "done";

  const formattedDueDate =
    dueDate && !Number.isNaN(dueDate.getTime())
      ? dueDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  const statusLabels = {
    backlog: "Backlog",
    todo: "Todo",
    "in-progress": "In Progress",
    done: "Done",
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-800">
          {task.title}
        </h4>

        <span
          className={`shrink-0 text-[10px] font-bold uppercase ${
            priorityStyles[task.priority] || "text-slate-500"
          }`}
        >
          {task.priority || "medium"}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
          {task.description}
        </p>
      )}

      {task.labels?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {task.labels.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
            >
              #{label}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 border-t border-slate-100 pt-3">
        {assignee && typeof assignee === "object" ? (
          <div className="flex items-center gap-2">
            {assigneeAvatar ? (
              <img
                src={assigneeAvatar}
                alt={assigneeName || "Assigned employee"}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                {assigneeInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-700">
                {assigneeName || "Unknown employee"}
              </p>

              {assigneeEmail && (
                <p className="truncate text-[10px] text-slate-400">
                  {assigneeEmail}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-400">
              ?
            </div>

            <span className="text-[11px] text-slate-400">
              Unassigned
            </span>
          </div>
        )}
      </div>

      {formattedDueDate && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-xs">
            {isOverdue ? "⚠️" : "📅"}
          </span>

          <span
            className={`text-[10px] font-medium ${
              isOverdue
                ? "text-red-600"
                : "text-slate-500"
            }`}
          >
            {isOverdue ? "Overdue · " : "Due · "}
            {formattedDueDate}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase text-slate-400">
          {statusLabels[task.status] || task.status}
        </span>

        <select
          value={task.status}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => {
            e.stopPropagation();

            onStatusChange(
              task._id,
              e.target.value,
            );
          }}
          className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-500 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
        >
          <option value="backlog">Backlog</option>
          <option value="todo">Todo</option>
          <option value="in-progress">
            In Progress
          </option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default TaskCard;

