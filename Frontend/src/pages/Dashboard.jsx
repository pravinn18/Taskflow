
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProjects, createProject } from "../api/projectApi";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6366f1");
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects();

      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load projects",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Only the owner/developer can create projects.");
      return;
    }

    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      const data = await createProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        color: projectColor,
      });

      if (data.success) {
        setProjects((currentProjects) => [
          data.project,
          ...currentProjects,
        ]);

        setProjectName("");
        setProjectDescription("");
        setProjectColor("#6366f1");

        setShowCreateForm(false);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-slate-200" />

          <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Projects
            </h1>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                isAdmin
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isAdmin ? "Owner / Developer" : "Employee"}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Manage your projects, employees, and tasks."
              : "View your projects and assigned tasks."}
          </p>

          {user?.name && (
            <p className="mt-2 text-xs text-slate-400">
              Welcome back, {user.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
        

          {isAdmin && (
            <button
              onClick={() => {
                setError("");
                setShowCreateForm(true);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + New Project
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-red-800">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

            <button
              onClick={() => {
                setError("");
                loadProjects();
              }}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              ℹ
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-800">
                Employee Account
              </p>

              <p className="mt-1 text-sm text-blue-600">
                You can view your available projects and work on
                assigned tasks. Project creation and management
                functions are restricted to the owner/developer.
              </p>
            </div>
          </div>
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
            +
          </div>

          <h3 className="text-base font-semibold text-slate-900">
            No projects yet
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            {isAdmin
              ? "Create your first project to start organizing tasks and collaborating."
              : "You currently don't have access to any projects. Ask the owner/developer to add you to a project."}
          </p>

          {isAdmin && (
            <button
              onClick={() => {
                setError("");
                setShowCreateForm(true);
              }}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Create your first project
            </button>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() =>
                navigate(`/projects/${project._id}`)
              }
              className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div
                className="mb-5 h-10 w-10 rounded-lg"
                style={{
                  backgroundColor:
                    project.color || "#6366f1",
                }}
              />

              <h3 className="text-base font-semibold text-slate-900">
                {project.name}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                {project.description || "No description"}
              </p>

              <div className="mt-5 flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                  {project.status || "active"}
                </span>

                <span className="text-sm text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateForm(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create Project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new project to manage your tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project Name
                </label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(e) =>
                    setProjectName(e.target.value)
                  }
                  placeholder="e.g. TaskFlow SaaS Platform"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={projectDescription}
                  onChange={(e) =>
                    setProjectDescription(e.target.value)
                  }
                  placeholder="Describe your project..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Project Color
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={projectColor}
                    onChange={(e) =>
                      setProjectColor(e.target.value)
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    disabled={creating}
                  />

                  <span className="text-sm text-slate-500">
                    {projectColor}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setProjectName("");
                    setProjectDescription("");
                    setProjectColor("#6366f1");
                  }}
                  disabled={creating}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                    creating
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {creating
                    ? "Creating..."
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

