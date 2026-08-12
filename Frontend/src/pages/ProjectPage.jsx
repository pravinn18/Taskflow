import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TaskModal from "../components/TaskModal";
import TaskCard from "../components/TaskCard";
import TaskDetailsModal from "../components/TaskDetailsModal";

import MemberList from "../components/MemberList";
import MemberModal from "../components/MemberModal";

import api from "../api/axios";

const EMPTY_BOARD = {
  backlog: [],
  todo: [],
  inProgress: [],
  done: [],
};

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [project, setProject] = useState(null);

  const [board, setBoard] = useState(EMPTY_BOARD);

  const loadCurrentUser = async () => {
    try {
      setLoadingUser(true);

      const response = await api.get("/auth/me");

      if (response.data.success) {
        setCurrentUser(response.data.user);
      }
    } catch (error) {
      console.error("Failed to load current user:", error);

      setError(
        error.response?.data?.message || "Failed to load user information",
      );
    } finally {
      setLoadingUser(false);
    }
  };

  const projectOwnerId =
    typeof project?.owner === "object" ? project?.owner?._id : project?.owner;

  const currentUserId = currentUser?.id || currentUser?._id;

  const isProjectOwner =
    Boolean(projectOwnerId) &&
    Boolean(currentUserId) &&
    projectOwnerId.toString() === currentUserId.toString();

  const isAdmin = currentUser?.role === "admin";

  const isDeveloper = currentUser?.role === "developer";

  const canManageProject = isProjectOwner || isAdmin || isDeveloper;

  const filterTasks = (tasks = []) => {
    return tasks.filter((task) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        task.title?.toLowerCase().includes(searchText) ||
        task.description?.toLowerCase().includes(searchText);

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  };

  
  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);

      if (response.data.success) {
        setProject(response.data.project);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load project");

      throw error;
    }
  };

  const loadBoard = async () => {
    try {
      const response = await api.get(`/tasks/project/${projectId}/board`);

      if (response.data.success) {
        setBoard(response.data.board || EMPTY_BOARD);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load tasks");

      throw error;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadCurrentUser(), loadProject(), loadBoard()]);
    } catch (error) {
      console.error("Failed to load project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setError("");

      await api.patch(`/tasks/${taskId}/status`, {
        status,
      });

      await loadBoard();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleMemberAdded = async () => {
    setShowMemberModal(false);

    await loadProject();
  };

  const handleTaskCreated = async () => {
    setShowTaskModal(false);

    await loadBoard();
  };

  const handleTaskUpdated = async () => {
    setSelectedTask(null);

    await loadBoard();
  };

  const handleTaskDeleted = async () => {
    setSelectedTask(null);

    await loadBoard();
  };
  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const filteredBacklog = useMemo(
    () => filterTasks(board.backlog),
    [board.backlog, search, priorityFilter, statusFilter],
  );

  const filteredTodo = useMemo(
    () => filterTasks(board.todo),
    [board.todo, search, priorityFilter, statusFilter],
  );

  const filteredInProgress = useMemo(
    () => filterTasks(board.inProgress),
    [board.inProgress, search, priorityFilter, statusFilter],
  );

  const filteredDone = useMemo(
    () => filterTasks(board.done),
    [board.done, search, priorityFilter, statusFilter],
  );

  const totalFilteredTasks =
    filteredBacklog.length +
    filteredTodo.length +
    filteredInProgress.length +
    filteredDone.length;

  const totalTasks =
    board.backlog.length +
    board.todo.length +
    board.inProgress.length +
    board.done.length;

  if (loading || loadingUser) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-slate-200" />

          <div className="mt-3 h-4 w-96 rounded bg-slate-200" />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1000px] grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((column) => (
              <div
                key={column}
                className="h-[500px] animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="font-semibold text-red-800">Unable to load project</h3>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              ←
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {project?.name}
                </h1>

                {project?.status && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                    {project.status}
                  </span>
                )}

                {canManageProject && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                    {isAdmin ? "Admin" : "Owner"}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {project?.description ||
                  "Manage your project tasks and workflow."}
              </p>
            </div>
          </div>

          {canManageProject && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Task
            </button>
          )}
        </div>
      </header>

      {canManageProject && (
        <div className="mb-6">
          <MemberList
            projectId={projectId}
            onAddMember={() => setShowMemberModal(true)}
          />
        </div>
      )}

      {!canManageProject && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm">
              👤
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Project Member
              </p>

              <p className="text-xs text-slate-500">
                You can view and work with tasks assigned to you.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>

          <button
            onClick={() => setError("")}
            className="ml-4 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
          <span className="text-slate-400">🔍</span>

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All priorities</option>

          <option value="low">Low</option>

          <option value="medium">Medium</option>

          <option value="high">High</option>

          <option value="urgent">Urgent</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="all">All statuses</option>

          <option value="backlog">Backlog</option>

          <option value="todo">Todo</option>

          <option value="in-progress">In Progress</option>

          <option value="done">Done</option>
        </select>
      </div>

      {(search || priorityFilter !== "all" || statusFilter !== "all") &&
        totalFilteredTasks === 0 && (
          <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-2xl">🔍</div>

            <h3 className="mt-3 font-semibold text-slate-900">
              No tasks found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setPriorityFilter("all");
                setStatusFilter("all");
              }}
              className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        )}

      <main>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Total */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total Tasks</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Backlog</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {board.backlog.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">In Progress</p>

            <p className="mt-2 text-2xl font-bold text-indigo-600">
              {board.inProgress.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Completed</p>

            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {board.done.length}
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Kanban Board
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your project workflow.
            </p>
          </div>

          <span className="hidden text-xs text-slate-400 sm:block">
            {totalFilteredTasks} {totalFilteredTasks === 1 ? "task" : "tasks"}{" "}
            shown
          </span>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-[1000px] grid-cols-4 gap-4">
            <section className="min-h-[500px] rounded-xl bg-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Backlog
                  </h3>

                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {filteredBacklog.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {filteredBacklog.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                ) : (
                  filteredBacklog.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="min-h-[500px] rounded-xl bg-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Todo
                  </h3>

                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {filteredTodo.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {filteredTodo.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                ) : (
                  filteredTodo.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="min-h-[500px] rounded-xl bg-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    In Progress
                  </h3>

                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {filteredInProgress.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {filteredInProgress.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                ) : (
                  filteredInProgress.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="min-h-[500px] rounded-xl bg-slate-100 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Done
                  </h3>

                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {filteredDone.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {filteredDone.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                    <p className="text-xs text-slate-400">No tasks</p>
                  </div>
                ) : (
                  filteredDone.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {showTaskModal && canManageProject && (
        <TaskModal
          projectId={projectId}
          project={project}
          onClose={() => setShowTaskModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          project={project}
          currentUser={currentUser}
          canManageProject={canManageProject}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {showMemberModal && canManageProject && (
        <MemberModal
          projectId={projectId}
          onClose={() => setShowMemberModal(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
};;

export default ProjectPage;
