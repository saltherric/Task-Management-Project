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

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const [localTask, setLocalTask] = useState(task);
  const [dirtyFields, setDirtyFields] = useState({});
  const [saveStatus, setSaveStatus] = useState("saved");


  useEffect(() => {
    setLocalTask(task);
    setDirtyFields({});
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

  const handleDeleteTask = async () => {
    try {
      await deleteTask(localTask._id);
      onDeleteTask(localTask._id);
    } catch (error) {
      console.error("Failed to delete task", error);
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
      }
    },
    1000
  );

  if (!isOpen || !localTask) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">

      <div className={`h-[90vh] w-[95vw] max-w-7xl rounded-xl overflow-hidden flex flex-col transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800 border border-slate-200 shadow-2xl"
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
        <div className="notif-scrollbar grid lg:grid-cols-[1fr_350px] flex-1 overflow-hidden overflow-y-auto p-6">

          {/* Left Content */}
          <div className=" space-y-8 pr-5">

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
          <aside className={`border-l overflow-y-auto p-5 space-y-6 transition-colors duration-300 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}>

            <TaskAssignedTo
              task={localTask}
              onTaskUpdate={handleTaskUpdate}
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

    </div>
  );
}