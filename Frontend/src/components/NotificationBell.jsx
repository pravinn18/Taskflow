import { useEffect, useState } from "react";
import api from "../api/axios";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;


  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      console.log("=================================");
      console.log("NOTIFICATIONS RESPONSE");
      console.log(response.data);
      console.log("=================================");

      if (response.data?.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadNotifications();
  }, []);

  const getInvitationId = (notification) => {
    const invitation = notification?.invitation;

    if (!invitation) {
      return null;
    }

    if (typeof invitation === "object") {
      return invitation._id || null;
    }

    if (typeof invitation === "string") {
      return invitation;
    }

    return null;
  };


  const getInvitationStatus = (notification) => {
    const invitation = notification?.invitation;

    if (!invitation) {
      return null;
    }

    if (typeof invitation === "object") {
      return invitation.status || null;
    }

    if (typeof invitation === "string") {
      return "pending";
    }

    return null;
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification:", error);
    }
  };


  const handleAcceptInvitation = async (invitationId, notificationId) => {
    if (!invitationId) {
      alert("Invitation information is missing. Please refresh the page.");
      return;
    }

    try {
      setActionLoading(`accept-${invitationId}`);

      console.log("ACCEPT INVITATION ID:", invitationId);

      const response = await api.put(`/invitations/${invitationId}/accept`);

      console.log("ACCEPT RESPONSE:", response.data);

      if (response.data?.success) {
        
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId),
        );
      }
    } catch (error) {
      console.error("Accept invitation error:", error);

      alert(error.response?.data?.message || "Failed to accept invitation.");
    } finally {
      setActionLoading(null);
    }
  };


  const handleRejectInvitation = async (invitationId, notificationId) => {
    if (!invitationId) {
      alert("Invitation information is missing. Please refresh the page.");
      return;
    }

    try {
      setActionLoading(`reject-${invitationId}`);

      console.log("REJECT INVITATION ID:", invitationId);

      const response = await api.put(`/invitations/${invitationId}/reject`);

      console.log("REJECT RESPONSE:", response.data);

      if (response.data?.success) {
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId),
        );
      }
    } catch (error) {
      console.error("Reject invitation error:", error);

      alert(error.response?.data?.message || "Failed to reject invitation.");
    } finally {
      setActionLoading(null);
    }
  };


  const handleToggle = () => {
    setOpen((prev) => !prev);

    if (!open) {
      loadNotifications();
    }
  };


  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:items-center sm:px-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Recent updates
              </p>
            </div>

            {unreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <p className="mt-3 text-sm text-slate-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-2xl">🔔</div>

                <p className="mt-2 text-sm font-medium text-slate-700">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isInvitation = notification.type === "project_invitation";

                const invitationId = getInvitationId(notification);

                const invitationStatus = getInvitationStatus(notification);

                const invitationPending =
                  isInvitation && invitationStatus === "pending";

                const isAccepting = actionLoading === `accept-${invitationId}`;

                const isRejecting = actionLoading === `reject-${invitationId}`;

                return (
                  <div
                    key={notification._id}
                    className={`border-b border-slate-100 px-3 py-4 transition sm:px-4 ${
                      !notification.isRead ? "bg-indigo-50/50" : "bg-white"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          !notification.isRead
                            ? "bg-indigo-500"
                            : "bg-slate-200"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification._id)}
                          className="w-full text-left"
                        >
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {notification.title || "Notification"}
                          </p>

                          <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                            {notification.message}
                          </p>
                        </button>

                        {isInvitation && invitationPending && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={
                                !invitationId || isAccepting || isRejecting
                              }
                              onClick={() =>
                                handleAcceptInvitation(
                                  invitationId,
                                  notification._id,
                                )
                              }
                              className="min-w-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isAccepting ? "Accepting..." : "Accept"}
                            </button>

                            <button
                              type="button"
                              disabled={
                                !invitationId || isAccepting || isRejecting
                              }
                              onClick={() =>
                                handleRejectInvitation(
                                  invitationId,
                                  notification._id,
                                )
                              }
                              className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isRejecting ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        )}

                        {isInvitation && !invitationId && (
                          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2">
                            <p className="text-[11px] font-medium text-red-600">
                              Invitation ID is missing from the server response.
                            </p>
                          </div>
                        )}

                        {isInvitation && invitationId && !invitationPending && (
                          <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[11px] font-medium capitalize text-slate-500">
                              Invitation {invitationStatus || "processed"}
                            </p>
                          </div>
                        )}

                        {notification.createdAt && (
                          <p className="mt-2 break-words text-[10px] text-slate-400">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
