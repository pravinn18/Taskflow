import { useEffect, useState } from "react";
import { getProjectMembers, removeProjectMember } from "../api/projectApi";

const MemberList = ({ projectId, onAddMember }) => {
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getProjectMembers(projectId);

      if (response.success) {
        setOwner(response.owner);
        setMembers(response.members || []);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load project members",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const handleRemove = async (userId) => {
    const confirmed = window.confirm("Remove this member from the project?");

    if (!confirmed) return;

    try {
      setError("");

      await removeProjectMember(projectId, userId);

      await loadMembers();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Project Members
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            People working on this project.
          </p>
        </div>

        <button
          onClick={onAddMember}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Add Member
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
         
          {owner && (
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {owner.name?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {owner.name}
                  </p>

                  <p className="text-xs text-slate-500">{owner.email}</p>
                </div>
              </div>

              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                Owner
              </span>
            </div>
          )}

          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {member.name?.charAt(0)?.toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {member.name}
                  </p>

                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>

              <button
                onClick={() => handleRemove(member._id)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center">
              <p className="text-sm text-slate-500">
                No additional members yet.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default MemberList;
