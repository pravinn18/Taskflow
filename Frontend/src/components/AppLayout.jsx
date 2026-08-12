import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import NotificationBell from "./NotificationBell";

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  return (
    <div className="min-h-screen bg-slate-50">

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-slate-950 text-white md:flex">
  

        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
            T
          </div>

          <span className="text-lg font-semibold">TaskFlow</span>
        </div>


        <nav className="flex-1 p-3">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>
        </nav>


        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>

              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>


      <div className="md:pl-60">

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
      

          <div>
            <span className="text-sm font-medium text-slate-500">
              Workspace
            </span>
          </div>


          <div className="flex items-center gap-3">

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500 transition hover:bg-slate-50"
            >
              ?
            </button>


            <NotificationBell />


            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>


        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
