import { useEffect, useState } from "react";
import api from "../api/axios";

const TaskModal = ({ projectId, project, onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [labels, setLabels] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMembers = async () => {
      if (project?.members) {
        setMembers(project.members);
        return;
      }

      try {
        setLoadingMembers(true);

        const response = await api.get(`/projects/${projectId}`);

        if (response.data.success) {
          setMembers(response.data.project?.members || []);
        }
      } catch (error) {
        console.error("Failed to load project members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [projectId, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/tasks", {
        title: title.trim(),
        description: description.trim(),
        projectId,
        assignee: assignee || null,
        priority,
        status,
        dueDate: dueDate || null,
        labels: labels
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
      });

      if (response.data.success) {
        await onCreated();
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[90vh] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Create Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new task to this project.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Task Title
            </label>

            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              placeholder="Describe the task"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Assign to Employee
            </label>

            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={loadingMembers}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">
                {loadingMembers ? "Loading employees..." : "Unassigned"}
              </option>

              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} — {member.email}
                </option>
              ))}
            </select>

            {!loadingMembers && members.length === 0 && (
              <p className="mt-1.5 text-xs text-slate-400">
                No project members available.
              </p>
            )}

            {assignee && (
              <p className="mt-1.5 text-xs text-indigo-600">
                This task will be assigned to the selected employee.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Priority
              </label>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              Select the deadline for this task.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Labels
            </label>

            <input
              type="text"
              placeholder="frontend, api, bug"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <p className="mt-1 text-xs text-slate-400">
              Separate multiple labels with commas.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
