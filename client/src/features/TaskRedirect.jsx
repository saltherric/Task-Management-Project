import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function TaskRedirect() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaskAndRedirect = async () => {
      try {
        const response = await API.get(`/tasks/${taskId}`);
        const task = response.data;
        if (task && task.project) {
          const projectId = task.project._id || task.project;
          const workspaceId = typeof task.project === "object" ? task.project.workspace : null;

          if (projectId && workspaceId) {
            navigate(`/workspaces/${workspaceId}/projects/${projectId}`, {
              state: { openTaskId: taskId },
              replace: true
            });
          } else {
            console.error("Task project or workspace not resolved", task);
            navigate("/home", { replace: true });
          }
        } else {
          setError("Task has no project associated with it.");
        }
      } catch (err) {
        console.error("Failed to redirect to task:", err);
        setError(err.response?.data?.message || "Task not found or access denied.");
      }
    };

    if (taskId) {
      fetchTaskAndRedirect();
    }
  }, [taskId, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200 p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full text-center shadow-xl">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Failed to open task</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            onClick={() => navigate("/home", { replace: true })}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-200">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-slate-400 text-sm animate-pulse">Redirecting to task board...</p>
    </div>
  );
}

export default TaskRedirect;
