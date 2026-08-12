import { useEffect, useState } from "react";
import api from "../api/axios";

const ProjectMembers = ({ projectId }) => {
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [error, setError] = useState("");

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/project-members/${projectId}/members`);

      if (response.data.success) {
        setMembers(response.data.members || []);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load project members",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/project-members/users");

      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load users");
    }
  };

  useEffect(() => {
    loadMembers();
    loadUsers();
  }, [projectId]);

  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Please select an employee");
      return;
    }

    try {
      setAdding(true);
      setError("");

      const response = await api.post(`/project-members/${projectId}/members`, {
        userId: selectedUser,
      });

      if (response.data.success) {
        setSelectedUser("");

        await loadMembers();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?",
    );

    if (!confirmed) return;

    try {
      setRemovingId(userId);
      setError("");

      const response = await api.delete(
        `/project-members/${projectId}/members/${userId}`,
      );

      if (response.data.success) {
        await loadMembers();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const availableUsers = users.filter(
    (user) => !members.some((member) => member._id === user._id),
  );

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 w-32 rounded bg-slate-200" />

          <div className="mt-4 h-10 rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Project Members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage employees working on this project.
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
          {members.length} {members.length === 1 ? "Member" : "Members"}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleAddMember}
        className="mt-5 flex flex-col gap-2 sm:flex-row"
      >
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Select an employee</option>

          {availableUsers.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} — {user.email}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={adding || !selectedUser}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? "Adding..." : "+ Add Member"}
        </button>
      </form>

      {members.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <div className="text-2xl">👥</div>

          <p className="mt-2 text-sm font-medium text-slate-700">
            No members yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Add employees who will work on this project.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                  {member.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {member.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {member.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveMember(member._id)}
                disabled={removingId === member._id}
                className="ml-3 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {removingId === member._id ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectMembers;
