
import { useEffect, useState } from "react";

import api from "../api/axios";

const TaskDetailsModal = ({
  task,
  project,
  currentUser,
  canManageProject,
  onClose,
  onUpdated,
}) => {

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(
    task?.description || "",
  );
  const [priority, setPriority] = useState(
    task?.priority || "medium",
  );
  const [status, setStatus] = useState(
    task?.status || "todo",
  );
  const [labels, setLabels] = useState(
    task?.labels?.join(", ") || "",
  );

  const [assignee, setAssignee] = useState(
    task?.assignee?._id || task?.assignee || "",
  );

  const [dueDate, setDueDate] = useState(
    task?.dueDate
      ? new Date(task.dueDate)
          .toISOString()
          .split("T")[0]
      : "",
  );

  const [members, setMembers] = useState(
    project?.members || [],
  );

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] =
    useState(false);
  const [addingComment, setAddingComment] =
    useState(false);
  const [commentError, setCommentError] = useState("");

  const [editingCommentId, setEditingCommentId] =
    useState(null);

  const [editingCommentText, setEditingCommentText] =
    useState("");

  const [savingCommentId, setSavingCommentId] =
    useState(null);

  const [deletingCommentId, setDeletingCommentId] =
    useState(null);


  const currentUserId =
    currentUser?.id || currentUser?._id;

  const currentUserRole =
    currentUser?.role || "";

  const normalizedRole =
    currentUserRole.toString().toLowerCase();

  const projectOwnerId =
    typeof project?.owner === "object"
      ? project?.owner?._id ||
        project?.owner?.id
      : project?.owner;

  const taskAssigneeId =
    typeof task?.assignee === "object"
      ? task?.assignee?._id ||
        task?.assignee?.id
      : task?.assignee;


  const isAdmin =
    normalizedRole === "admin";

  const isDeveloper =
    normalizedRole === "developer" ||
    normalizedRole === "employee";

  const isProjectOwner =
    Boolean(currentUserId) &&
    Boolean(projectOwnerId) &&
    currentUserId.toString() ===
      projectOwnerId.toString();

  const isAssignedEmployee =
    Boolean(currentUserId) &&
    Boolean(taskAssigneeId) &&
    currentUserId.toString() ===
      taskAssigneeId.toString();

  const canManageTask =
    isAdmin ||
    isDeveloper ||
    isProjectOwner;

  const canEditTask =
    isAdmin ||
    isProjectOwner;

  const canDeleteTask =
    isAdmin ||
    isDeveloper ||
    isProjectOwner;

  const canUpdateStatus =
    canManageTask ||
    isAssignedEmployee;

  useEffect(() => {
    if (!task) return;

    setTitle(task.title || "");

    setDescription(
      task.description || "",
    );

    setPriority(
      task.priority || "medium",
    );

    setStatus(
      task.status || "todo",
    );

    setLabels(
      task.labels?.join(", ") || "",
    );

    setAssignee(
      task.assignee?._id ||
        task.assignee ||
        "",
    );

    setDueDate(
      task.dueDate
        ? new Date(task.dueDate)
            .toISOString()
            .split("T")[0]
        : "",
    );

    setError("");
  }, [task]);

  useEffect(() => {
    const loadMembers = async () => {
      if (Array.isArray(project?.members)) {
        setMembers(project.members);
        return;
      }

      const projectId =
        typeof task?.project === "object"
          ? task.project?._id
          : task?.project;

      if (!projectId) return;

      try {
        setLoadingMembers(true);

        const response = await api.get(
          `/projects/${projectId}`,
        );

        if (response.data?.success) {
          setMembers(
            response.data?.project?.members ||
              [],
          );
        }
      } catch (error) {
        console.error(
          "Failed to load project members:",
          error,
        );
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [project, task?.project]);


  const loadComments = async () => {
    if (!task?._id) return;

    try {
      setLoadingComments(true);
      setCommentError("");

      const response = await api.get(
        `/comments/task/${task._id}`,
      );

      if (response.data?.success) {
        setComments(
          response.data.comments || [],
        );
      }
    } catch (error) {
      console.error(
        "Failed to load comments:",
        error,
      );

      setCommentError(
        error.response?.data?.message ||
          "Failed to load comments.",
      );
    } finally {
      setLoadingComments(false);
    }
  };


  useEffect(() => {
    if (task?._id) {
      loadComments();
    }
  }, [task?._id]);

  const handleAddComment = async (e) => {
    e.preventDefault();

    const content = commentText.trim();

    if (!content) {
      setCommentError(
        "Comment cannot be empty.",
      );
      return;
    }

    if (content.length > 2000) {
      setCommentError(
        "Comment cannot exceed 2000 characters.",
      );
      return;
    }

    try {
      setAddingComment(true);
      setCommentError("");

      const response = await api.post(
        `/comments/task/${task._id}`,
        {
          content,
        },
      );

      if (response.data?.success) {
        setComments((prev) => [
          ...prev,
          response.data.comment,
        ]);

        setCommentText("");
      }
    } catch (error) {
      console.error(
        "Add comment error:",
        error,
      );

      setCommentError(
        error.response?.data?.message ||
          "Failed to add comment.",
      );
    } finally {
      setAddingComment(false);
    }
  };


  const handleStartEditComment = (
    comment,
  ) => {
    setEditingCommentId(comment._id);

    setEditingCommentText(
      comment.content || "",
    );

    setCommentError("");
  };


  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveComment = async (
    commentId,
  ) => {
    const content =
      editingCommentText.trim();

    if (!content) {
      setCommentError(
        "Comment cannot be empty.",
      );
      return;
    }

    if (content.length > 2000) {
      setCommentError(
        "Comment cannot exceed 2000 characters.",
      );
      return;
    }

    try {
      setSavingCommentId(commentId);
      setCommentError("");

      const response = await api.put(
        `/comments/${commentId}`,
        {
          content,
        },
      );

      if (response.data?.success) {
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? response.data.comment
              : comment,
          ),
        );

        handleCancelEditComment();
      }
    } catch (error) {
      console.error(
        "Update comment error:",
        error,
      );

      setCommentError(
        error.response?.data?.message ||
          "Failed to update comment.",
      );
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = async (
    commentId,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) return;

    try {
      setDeletingCommentId(commentId);
      setCommentError("");

      const response = await api.delete(
        `/comments/${commentId}`,
      );

      if (response.data?.success) {
        setComments((prev) =>
          prev.filter(
            (comment) =>
              comment._id !== commentId,
          ),
        );
      }
    } catch (error) {
      console.error(
        "Delete comment error:",
        error,
      );

      setCommentError(
        error.response?.data?.message ||
          "Failed to delete comment.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };


  const canEditComment = (comment) => {
    const authorId =
      typeof comment?.author === "object"
        ? comment?.author?._id
        : comment?.author;

    return (
      isAdmin ||
      (currentUserId &&
        authorId &&
        currentUserId.toString() ===
          authorId.toString())
    );
  };

  const canDeleteComment = (comment) => {
    const authorId =
      typeof comment?.author === "object"
        ? comment?.author?._id
        : comment?.author;

    return (
      isAdmin ||
      (currentUserId &&
        authorId &&
        currentUserId.toString() ===
          authorId.toString())
    );
  };


  const formatCommentDate = (date) => {
    if (!date) return "";

    const commentDate = new Date(date);

    const now = new Date();

    const difference =
      now.getTime() -
      commentDate.getTime();

    const seconds = Math.floor(
      difference / 1000,
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(
      seconds / 60,
    );

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60,
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24,
    );

    if (days < 7) {
      return `${days}d ago`;
    }

    return commentDate.toLocaleDateString();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!task?._id) {
      setError("Task ID is missing.");
      return;
    }

    if (!canEditTask) {
      setError(
        "You don't have permission to edit this task.",
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Task title is required.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        title: title.trim(),

        description:
          description.trim(),

        assignee:
          assignee || null,

        priority,

        status,

        dueDate:
          dueDate || null,

        labels: labels
          .split(",")
          .map((label) =>
            label.trim(),
          )
          .filter(Boolean),
      };

      const response =
        await api.put(
          `/tasks/${task._id}`,
          payload,
        );

      if (response.data?.success) {
        if (onUpdated) {
          await onUpdated(
            response.data.task,
          );
        }

        onClose();
      } else {
        setError(
          response.data?.message ||
            "Task update failed.",
        );
      }
    } catch (error) {
      console.error(
        "Update task error:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Failed to update task.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    newStatus,
  ) => {
    if (!canUpdateStatus) {
      setError(
        "You can only update tasks assigned to you.",
      );
      return;
    }

    if (canEditTask) {
      setStatus(newStatus);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await api.patch(
          `/tasks/${task._id}/status`,
          {
            status: newStatus,
          },
        );

      if (response.data?.success) {
        setStatus(newStatus);

        if (onUpdated) {
          await onUpdated(
            response.data.task,
          );
        }

        onClose();
      }
    } catch (error) {
      console.error(
        "Update task status error:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Failed to update task status.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteTask) {
      setError(
        "You don't have permission to delete this task.",
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone.",
      );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response =
        await api.delete(
          `/tasks/${task._id}`,
        );

      if (response.data?.success) {
        if (onUpdated) {
          await onUpdated();
        }

        onClose();
      }
    } catch (error) {
      console.error(
        "Delete task error:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete task.",
      );
    } finally {
      setDeleting(false);
    }
  };


  const priorityStyles = {
    low:
      "bg-slate-100 text-slate-600",

    medium:
      "bg-blue-50 text-blue-700",

    high:
      "bg-orange-50 text-orange-700",

    urgent:
      "bg-red-50 text-red-700",
  };

  if (!task) {
    return null;
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (
          e.target ===
          e.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
   

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Task Details
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  priorityStyles[
                    priority
                  ] ||
                  priorityStyles.medium
                }`}
              >
                {priority}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              View task information,
              comments, and activity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>

       

        <div className="border-b border-slate-100 px-6 pt-4">
          {canManageTask ? (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
              <p className="text-xs font-semibold text-indigo-700">
                Full Management Access
              </p>

              <p className="mt-1 text-xs text-indigo-600">
                You can edit, reassign,
                change status, and
                delete this task.
              </p>
            </div>
          ) : isAssignedEmployee ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-700">
                Assigned Task
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                You can update the
                status of this task.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-600">
                View Only
              </p>

              <p className="mt-1 text-xs text-slate-500">
                You don't have
                permission to modify
                this task.
              </p>
            </div>
          )}
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate}>
            <div className="space-y-5">

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value,
                    )
                  }
                  disabled={
                    !canEditTask ||
                    loading ||
                    deleting
                  }
                  maxLength={150}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                />
              </div>


              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value,
                    )
                  }
                  disabled={
                    !canEditTask ||
                    loading ||
                    deleting
                  }
                  rows={5}
                  maxLength={2000}
                  placeholder="Add a description..."
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                />
              </div>


              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Assign to Employee
                </label>

                <select
                  value={assignee}
                  onChange={(e) =>
                    setAssignee(
                      e.target.value,
                    )
                  }
                  disabled={
                    !canEditTask ||
                    loading ||
                    deleting ||
                    loadingMembers
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingMembers
                      ? "Loading employees..."
                      : "Unassigned"}
                  </option>

                  {members.map(
                    (member) => (
                      <option
                        key={
                          member._id
                        }
                        value={
                          member._id
                        }
                      >
                        {member.name}

                        {member.email
                          ? ` — ${member.email}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value,
                    )
                  }
                  disabled={
                    !canEditTask ||
                    loading ||
                    deleting
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value,
                      )
                    }
                    disabled={
                      !canEditTask ||
                      loading ||
                      deleting
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  >
                    <option value="low">
                      Low
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="high">
                      High
                    </option>

                    <option value="urgent">
                      Urgent
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      handleStatusChange(
                        e.target
                          .value,
                      )
                    }
                    disabled={
                      !canUpdateStatus ||
                      loading ||
                      deleting
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                  >
                    <option value="backlog">
                      Backlog
                    </option>

                    <option value="todo">
                      Todo
                    </option>

                    <option value="in-progress">
                      In Progress
                    </option>

                    <option value="done">
                      Done
                    </option>
                  </select>
                </div>
              </div>


              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Labels
                </label>

                <input
                  type="text"
                  value={labels}
                  onChange={(e) =>
                    setLabels(
                      e.target.value,
                    )
                  }
                  disabled={
                    !canEditTask ||
                    loading ||
                    deleting
                  }
                  placeholder="frontend, bug, api"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Separate multiple
                  labels with commas.
                </p>
              </div>


              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">
                  Current Assignee
                </p>

                <div className="mt-2 flex items-center gap-3">
                  {task.assignee &&
                  typeof task.assignee ===
                    "object" ? (
                    <>
                      {task.assignee
                        .avatar ? (
                        <img
                          src={
                            task
                              .assignee
                              .avatar
                          }
                          alt={
                            task
                              .assignee
                              .name ||
                            "Assigned employee"
                          }
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                          {task.assignee.name
                            ?.charAt(
                              0,
                            )
                            .toUpperCase() ||
                            "?"}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {task.assignee
                            .name ||
                            "Unknown employee"}
                        </p>

                        {task.assignee
                          .email && (
                          <p className="text-xs text-slate-500">
                            {
                              task
                                .assignee
                                .email
                            }
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-500">
                        ?
                      </div>

                      <p className="text-sm text-slate-500">
                        No employee
                        assigned
                      </p>
                    </>
                  )}
                </div>
              </div>


              <div className="rounded-lg bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {task.createdAt
                        ? new Date(
                            task.createdAt,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Last updated
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {task.updatedAt
                        ? new Date(
                            task.updatedAt,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Due date
                    </p>

                    <p className="mt-1 font-medium text-slate-700">
                      {task.dueDate
                        ? new Date(
                            task.dueDate,
                          ).toLocaleDateString()
                        : "No due date"}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Comments
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Discuss this task with
                    your project team.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {comments.length}
                </span>
              </div>

              {commentError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {commentError}
                </div>
              )}


              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                    {currentUser?.name
                      ?.charAt(0)
                      .toUpperCase() ||
                      "U"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) =>
                        setCommentText(
                          e.target
                            .value,
                        )
                      }
                      rows={3}
                      maxLength={2000}
                      placeholder="Write a comment..."
                      disabled={
                        addingComment
                      }
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {commentText.length}
                        /2000
                      </span>

                      <button
                        type="button"
                        onClick={
                          handleAddComment
                        }
                        disabled={
                          addingComment ||
                          !commentText.trim()
                        }
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingComment
                          ? "Adding..."
                          : "Add Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>


              <div className="mt-5 space-y-4">
                {loadingComments ? (
                  <>
                    {[1, 2].map(
                      (item) => (
                        <div
                          key={item}
                          className="flex animate-pulse gap-3"
                        >
                          <div className="h-9 w-9 rounded-full bg-slate-200" />

                          <div className="flex-1">
                            <div className="h-4 w-32 rounded bg-slate-200" />

                            <div className="mt-2 h-12 rounded-lg bg-slate-100" />
                          </div>
                        </div>
                      ),
                    )}
                  </>
                ) : comments.length ===
                  0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <div className="text-2xl">
                      💬
                    </div>

                    <p className="mt-2 text-sm font-medium text-slate-700">
                      No comments yet
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Be the first to
                      comment on this
                      task.
                    </p>
                  </div>
                ) : (
                  comments.map(
                    (comment) => {
                      const author =
                        typeof comment.author ===
                        "object"
                          ? comment.author
                          : null;

                      const authorName =
                        author?.name ||
                        "Unknown user";

                      const isEditing =
                        editingCommentId ===
                        comment._id;

                      return (
                        <div
                          key={
                            comment._id
                          }
                          className="flex gap-3"
                        >
                          {author?.avatar ? (
                            <img
                              src={
                                author.avatar
                              }
                              alt={
                                authorName
                              }
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                              {authorName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {
                                  authorName
                                }
                              </p>

                              {author?.role && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                                  {
                                    author.role
                                  }
                                </span>
                              )}

                              <span className="text-xs text-slate-400">
                                {formatCommentDate(
                                  comment.createdAt,
                                )}
                              </span>
                            </div>

                            {isEditing ? (
                              <div className="mt-2">
                                <textarea
                                  value={
                                    editingCommentText
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    setEditingCommentText(
                                      e
                                        .target
                                        .value,
                                    )
                                  }
                                  rows={3}
                                  maxLength={
                                    2000
                                  }
                                  className="w-full resize-none rounded-lg border border-indigo-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                />

                                <div className="mt-2 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveComment(
                                        comment._id,
                                      )
                                    }
                                    disabled={
                                      savingCommentId ===
                                      comment._id
                                    }
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                  >
                                    {savingCommentId ===
                                    comment._id
                                      ? "Saving..."
                                      : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      handleCancelEditComment
                                    }
                                    disabled={
                                      savingCommentId ===
                                      comment._id
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5">
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                  {
                                    comment.content
                                  }
                                </p>
                              </div>
                            )}


                            {!isEditing && (
                              <div className="mt-2 flex gap-3">
                                {canEditComment(
                                  comment,
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartEditComment(
                                        comment,
                                      )
                                    }
                                    className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                                  >
                                    Edit
                                  </button>
                                )}

                                {canDeleteComment(
                                  comment,
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(
                                        comment._id,
                                      )
                                    }
                                    disabled={
                                      deletingCommentId ===
                                      comment._id
                                    }
                                    className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
                                  >
                                    {deletingCommentId ===
                                    comment._id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>


            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              {canDeleteTask ? (
                <button
                  type="button"
                  onClick={
                    handleDelete
                  }
                  disabled={
                    loading ||
                    deleting
                  }
                  className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Task"}
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={
                    loading ||
                    deleting
                  }
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>

                {canEditTask && (
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      deleting
                    }
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {loading
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
