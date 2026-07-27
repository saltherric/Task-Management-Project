import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { validateInvite, joinWorkspace } from "../services/inviteApi";
import { getAuthState } from "../helpers/auth";
import { useAlert } from "../contexts/AlertContext";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated } = getAuthState();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [invite, setInvite] = useState(null);

  // "invalid" | "expired" | null
  const [errorState, setErrorState] = useState(null);

  const [alreadyMember, setAlreadyMember] = useState(false);

  const [joinSuccess, setJoinSuccess] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!token) return;

    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      setAlreadyMember(false);

      const data = await validateInvite(token);

      setInvite(data);
    } catch (error) {
      const message = error.response?.data?.message;

      switch (message) {
        case "Invite link has expired":
          setErrorState("expired");
          break;

        case "Invalid invite link":
          setErrorState("invalid");
          break;

        default:
          setErrorState("invalid");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // LOGIN
  // ===========================

  const handleLogin = () => {
    navigate("/login", {
      state: {
        redirectTo: location.pathname + location.search
      },
    });
  };

  // ===========================
  // JOIN WORKSPACE
  // ===========================

  const handleJoinWorkspace = async () => {
    if (joining) return;

    try {
      setJoining(true);

      const data = await joinWorkspace(token);

      setJoinSuccess(true);
      showAlert("Successfully joined the workspace!", "success");

      setTimeout(() => {
        navigate(`/workspaces/${data.workspace._id}`);
      }, 1500);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login", {
          state: {
            redirectTo: location.pathname + location.search
          },
        });

        return;
      }

      const message = error.response?.data?.message;

      if (message === "You are already a member") {
        setAlreadyMember(true);
        showAlert("You are already a member of this workspace.", "info");
      } else {
        showAlert(message || "Failed to join workspace.", "error");
      }
    } finally {
      setJoining(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
        <div className="w-full max-w-[500px] bg-[#1F1F23] border border-slate-800 rounded-[24px] p-10 text-center shadow-2xl">

          <div className="relative w-14 h-14 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#6366F1] animate-spin" />
          </div>

          <h2 className="text-white text-lg font-bold">
            Validating invitation...
          </h2>

          <p className="text-slate-400 text-sm mt-2">
            Please wait while we verify your invite link.
          </p>

        </div>
      </div>
    );
  }

  if (errorState === "invalid") {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
        <div className="w-full max-w-[500px] bg-[#1F1F23] border border-red-500/20 rounded-[24px] p-10 text-center shadow-2xl">

          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01m7-4a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

          </div>

          <h2 className="text-white text-xl font-bold">
            Invalid Invitation
          </h2>

          <p className="text-slate-400 mt-3 text-sm leading-relaxed">
            This invitation link is invalid or no longer exists.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full h-12 rounded-xl bg-[#6366F1] hover:bg-blue-600 text-white font-semibold transition"
          >
            Back to Home
          </button>

        </div>
      </div>
    );
  }

  if (errorState === "expired") {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
        <div className="w-full max-w-[500px] bg-[#1F1F23] border border-orange-500/20 rounded-[24px] p-10 text-center shadow-2xl">

          <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-7 h-7 text-orange-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

          </div>

          <h2 className="text-white text-xl font-bold">
            Invitation Expired
          </h2>

          <p className="text-slate-400 mt-3 text-sm leading-relaxed">
            This invitation has expired. Please ask the workspace administrator
            for a new invite link.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full h-12 rounded-xl bg-[#6366F1] hover:bg-blue-600 text-white font-semibold transition"
          >
            Back to Home
          </button>

        </div>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
        <div className="w-full max-w-[500px] bg-[#1F1F23] border border-emerald-500/20 rounded-[24px] p-10 text-center shadow-2xl">

          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>

          </div>

          <h2 className="text-white text-2xl font-bold">
            You're already a member
          </h2>

          <p className="text-slate-400 mt-3 leading-relaxed">
            You already belong to
            <span className="text-[#6366F1] font-semibold">
              {" "}
              {invite?.workspace?.name}
            </span>.
          </p>

          <button
            onClick={() =>
              navigate(`/workspaces/${invite?.workspace?._id}`)
            }
            className="mt-8 w-full h-12 rounded-xl bg-[#6366F1] hover:bg-blue-600 transition text-white font-semibold"
          >
            Open Workspace
          </button>

        </div>
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">
        <div className="w-full max-w-[500px] bg-[#1F1F23] border border-emerald-500/20 rounded-[24px] p-10 text-center shadow-2xl">

          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>

          </div>

          <h2 className="text-white text-2xl font-bold">
            Welcome!
          </h2>

          <p className="text-slate-400 mt-3">
            You've successfully joined
          </p>

          <h3 className="text-[#6366F1] text-lg font-semibold mt-2">
            {invite?.workspace?.name}
          </h3>

          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div>
          </div>

          <p className="text-xs text-slate-500 mt-5">
            Redirecting to workspace...
          </p>

        </div>
      </div>
    );
  }

  // ==========================================
// MAIN INVITE CARD
// ==========================================

return (
  <div className="min-h-screen bg-[#090D16] flex items-center justify-center px-4">

    <div className="w-full max-w-[520px] bg-[#1F1F23] border border-slate-800 rounded-[24px] shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="px-8 pt-10 pb-8 text-center border-b border-slate-800">

        <div className="w-16 h-16 rounded-2xl bg-[#6366F1] flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-lg">
          {invite?.workspace?.name?.charAt(0)}
        </div>

        <h1 className="mt-6 text-2xl font-bold text-white">
          You're invited!
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Join this workspace and start collaborating.
        </p>

        <h2 className="mt-4 text-xl font-semibold text-[#6366F1]">
          {invite?.workspace?.name}
        </h2>

      </div>

      {/* Body */}
      <div className="p-8">

        <div className="rounded-2xl border border-slate-800 bg-[#171A22] divide-y divide-slate-800">

          {/* Workspace */}

          <div className="flex items-center justify-between px-5 py-4">

            <span className="text-sm text-slate-400">
              Workspace
            </span>

            <span className="text-sm font-semibold text-white text-right">
              {invite?.workspace?.name}
            </span>

          </div>

          {/* Role */}

          <div className="flex items-center justify-between px-5 py-4">

            <span className="text-sm text-slate-400">
              Role
            </span>

            <span className="inline-flex items-center rounded-full bg-[#6366F1]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#4EB3FF]">
              {invite?.role}
            </span>

          </div>

          {/* Expiration */}

          <div className="flex items-center justify-between px-5 py-4">

            <span className="text-sm text-slate-400">
              Expires
            </span>

            <span className="text-sm font-medium text-white">
              {invite?.expiresAt
                ? new Date(invite.expiresAt).toLocaleDateString()
                : "-"}
            </span>

          </div>

        </div>

        {/* Info */}

        <div className="mt-6 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 p-4">

          <p className="text-sm text-slate-300 leading-relaxed">
            By joining this workspace you'll be able to collaborate with
            other members, access shared projects, manage tasks, and receive
            future workspace updates.
          </p>

        </div>

        <div className="mt-8">
          {/* Logged In */}

          {isAuthenticated ? (
            <button
              onClick={handleJoinWorkspace}
              disabled={joining}
              className="w-full h-12 rounded-xl bg-[#6366F1] hover:bg-blue-600 transition-all text-white font-semibold disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join Workspace"}
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full h-12 rounded-xl bg-[#6366F1] hover:bg-blue-600 transition-all text-white font-semibold"
            >
              Log in to Join
            </button>
          )}

          {/* Divider */}

          <div className="mt-6 border-t border-slate-800 pt-5">

            <p className="text-center text-xs text-slate-500 leading-6">

              By joining this workspace you agree to collaborate
              with other members and gain access to the shared
              projects within this workspace.

            </p>

          </div>

        </div>

      </div>

    </div>

  </div>
);
}
