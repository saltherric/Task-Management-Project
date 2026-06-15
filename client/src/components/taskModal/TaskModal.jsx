import React, { useEffect, useState } from "react";

import TaskBadge from "./TaskBadge";
import TaskHeader from "./TaskHeader";
import TaskDescription from "./TaskDescription";
import TaskComments from "./TaskComments";
import TaskAttachments from "./TaskAttachments";
import TaskAssignedTo from "./TaskAssignedTo";
import TaskMetadata from "./TaskMetaData";
import { updateTask } from "../../services/taskApi";
import useAutoSave from "../../hooks/useAutoSave";
import TaskDueDate from "./TaskDueDate";

export default function TaskModal({
  task,
  isOpen,
  onClose,
  onUpdateTask,
}) {
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

        const response =
          await updateTask(
            localTask._id,
            dirtyFields
          );

        if (response?.task) {
          onUpdateTask(
            response.task
          );
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

      <div className="bg-slate-900 h-[90vh] w-[] max-w-7xl rounded-xl overflow-hidden flex flex-col">

        {/* Fixed Top Area */}
        <TaskBadge
          task={localTask}
          saveStatus={saveStatus}
          onClose={onClose}
          updateField={updateField}
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
            />

            <TaskComments
              taskId={localTask._id}
            />
            
          </div>

          {/* Sidebar */}
          <aside className="border-l border-slate-800 overflow-y-auto p-5">

            <TaskAssignedTo
              task={localTask}
              onTaskUpdate={setLocalTask}
            />

            <TaskDueDate
              task={localTask}
              updateField={updateField}
            />

            <TaskMetadata
              task={localTask}
            />

          </aside>

        </div>

      </div>

    </div>
  );
}