import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";

import TaskBadge from "./TaskBadge";
import TaskHeader from "./TaskHeader";
import TaskDescription from "./TaskDescription";
import TaskComments from "./TaskComments";
import TaskAttachments from "./TaskAttachments";
import TaskAssignedTo from "./TaskAssignedTo";
import TaskTags from "./TaskTags";
import { updateTask, deleteTask } from "../../services/taskApi";
import useAutoSave from "../../hooks/useAutoSave";
import TaskDueDate from "./TaskDueDate";
import TaskMetaData from "./TaskMetaData";
import { useAlert } from "../../contexts/AlertContext";
import ConfirmDeleteTaskModal from "./ConfirmDeleteTaskModal";

export default function TaskModal({
  task,
  isOpen,
  isAdmin,
  columns,
  onClose,
  onUpdateTask,
  onDeleteTask
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [localTask, setLocalTask] = useState(task);
  const [dirtyFields, setDirtyFields] = useState({});
  const [saveStatus, setSaveStatus] = useState("saved");
  const { showAlert } = useAlert();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    setLocalTask(task);
    setDirtyFields({});
    setIsDeleteConfirmOpen(false);
    setIsDeleting(false);
  }, [task]);

  const updateField = (
    field,
    value
  ) => {
    setLocalTask((prev) => ({
      ...prev,
      [field]: value,
    }));

    setDirtyFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTaskUpdate = (updatedTask) => {
    setLocalTask(updatedTask);
    onUpdateTask(updatedTask);
  };

  const handleDeleteTask = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(localTask._id);
      setIsDeleteConfirmOpen(false);
      onDeleteTask(localTask._id);
      showAlert("Task deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete task", error);
      showAlert(error.response?.data?.message || "Failed to delete task.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  useAutoSave(
    dirtyFields,
    async () => {
      if (
        !localTask?._id ||
        Object.keys(dirtyFields)
          .length === 0
      ) {
        return;
      }

      try {
        setSaveStatus("saving");

        const response = await updateTask(
          localTask._id,
          dirtyFields
        );

        const updatedTask = response?.task ?? response;

        if (updatedTask) {
          onUpdateTask(updatedTask);
        }

        setSaveStatus("saved");
        setDirtyFields({});

      } catch (error) {
        console.error(error);
        setSaveStatus("error");
        showAlert(error.response?.data?.message || "Failed to auto-save task changes.", "error");
      }
    },
    1000
  );

  if (!isOpen || !localTask) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[2px] flex items-center justify-center">

      <div className={`h-[82vh] w-[calc(100%-2rem)] max-w-5xl rounded-xl overflow-hidden flex flex-col transition-colors duration-300 shadow-2xl ${isDark ? "bg-slate-900 text-slate-100 border border-slate-800/80" : "bg-white text-slate-800 border border-slate-200"
        }`}>

        {/* Top Area */}
        <TaskBadge
          task={localTask}
          saveStatus={saveStatus}
          onClose={onClose}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleDeleteTask}
        />

        <TaskHeader
          task={localTask}
          updateField={updateField}
        />

        {/* Body */}
        <div className="notif-scrollbar grid lg:grid-cols-[1fr_280px] flex-1 overflow-hidden overflow-y-auto p-6 gap-6">

          {/* Left Content */}
          <div className="space-y-8">

            <TaskDescription
              task={localTask}
              updateField={updateField}
            />

            <TaskAttachments
              taskId={localTask._id}
              updateField={updateField}
            />

            <TaskComments
              taskId={localTask._id}
              updateField={updateField}
            />

          </div>

          {/* Sidebar */}
          <aside className={`border-t lg:border-t-0 lg:border-l lg:pl-6 pt-6 lg:pt-0 space-y-6 transition-colors duration-300 ${isDark ? "border-slate-800/80" : "border-slate-200"
            }`}>

            <TaskAssignedTo
              task={localTask}
              onTaskUpdate={handleTaskUpdate}
              isAdmin={isAdmin}
            />

            <TaskDueDate
              task={localTask}
              updateField={updateField}
            />

            <TaskTags
              task={localTask}
              updateField={updateField}
            />

            <TaskMetaData
              task={localTask}
            />
          </aside>

        </div>

      </div>

      <ConfirmDeleteTaskModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        taskTitle={localTask?.title || ""}
        isDark={isDark}
        isDeleting={isDeleting}
      />
    </div>
  );
}