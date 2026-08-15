import { useEffect, useState } from "react";
import api from "../api/axios";

const ActivityPanel = ({ taskId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const loadActivities = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/activities/task/${taskId}`);

      if (response.data?.success) {
        setActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);

      setError(error.response?.data?.message || "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [taskId]);


  const formatDate = (date) => {
    if (!date) return "";

    const activityDate = new Date(date);
    const now = new Date();

    const difference = now.getTime() - activityDate.getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return activityDate.toLocaleDateString();
  };


  const getActivityIcon = (type) => {
    switch (type) {
      case "created":
        return "＋";

      case "updated":
        return "✎";

      case "status_changed":
        return "↔";

      case "assigned":
        return "→";

      case "unassigned":
        return "×";

      case "priority_changed":
        return "⚡";

      case "due_date_changed":
        return "◷";

      case "label_changed":
        return "🏷";

      case "comment_added":
        return "💬";

      case "comment_updated":
        return "✎";

      case "comment_deleted":
        return "🗑";

      case "deleted":
        return "×";

      default:
        return "•";
    }
  };


  if (!taskId) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          Activity
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Track changes and actions performed on this task.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-700 sm:px-4 sm:text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200" />

              <div className="flex-1">
                <div className="h-4 w-48 rounded bg-slate-200" />

                <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center sm:p-8">
          <div className="text-2xl">◷</div>

          <p className="mt-2 text-sm font-medium text-slate-700">
            No activity yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Task changes will appear here.
          </p>
        </div>
      ) : (
        <div className="relative space-y-4 sm:space-y-5">
          <div className="absolute bottom-2 left-4 top-2 w-px bg-slate-200" />

          {activities.map((activity) => {
            const user = activity.user;

            const userName = user?.name || "Unknown user";

            return (
              <div
                key={activity._id}
                className="relative flex gap-2.5 sm:gap-3"
              >
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                      {userName}
                    </p>

                    {user?.role && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-500">
                        {user.role}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 sm:text-xs">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>

                  <p className="mt-1 break-words text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                    {activity.message}
                  </p>

                  {(activity.oldValue !== null ||
                    activity.newValue !== null) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {activity.oldValue !== null && (
                        <span className="max-w-full break-words rounded-md bg-red-50 px-2 py-1 text-red-600">
                          {String(activity.oldValue)}
                        </span>
                      )}

                      {activity.oldValue !== null &&
                        activity.newValue !== null && (
                          <span className="text-slate-400">→</span>
                        )}

                      {activity.newValue !== null && (
                        <span className="max-w-full break-words rounded-md bg-emerald-50 px-2 py-1 text-emerald-600">
                          {String(activity.newValue)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityPanel;
