import React, { useState } from 'react'
import TaskColumn from './TaskColumn'
import AddTaskModal from './AddTaskModal'
import { DragDropContext } from '@hello-pangea/dnd';
import { resumeToPipeableStream } from 'react-dom/server';

// Main page

function TaskPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Learn React",
      description: "Practice components",
      priority: "Medium",
      status: "Pending",
    },

    {
      id: 2,
      title: "Build Redux",
      description: "Create store and slice",
      priority: "High",
      status: "In Progress",
    },

    {
      id: 3,
      title: "Setup Bootstrap",
      description: "Install bootstrap package",
      priority: "Low",
      status: "Completed",
    },
    {
      id: 4,
      title: "Watch Tutorial video",
      description: "How to redux",
      priority: "High",
      status: "In Progress",
    },
    
  ]);

  const addTask = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const updateTask = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleDragEnd = (result) => {
    if(!result.destination) return;
    
    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: newStatus,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
  }

  const pendingTasks = tasks.filter(
    task => task.status === "Pending"
  );

  const progressTasks = tasks.filter(
    task => task.status === "In Progress"
  );

  const completedTasks = tasks.filter(
    task => task.status === "Completed"
  );

  return (
   <div className="container py-4">

      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1>Task Manager</h1>
        <button className="btn btn-danger"> Logout </button>
      </div>

      <div className="d-flex justify-content-end mb-4">
        <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal"> 
          Add New Task
        </button>
      </div>
  
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="row g-4">
          <TaskColumn title="Pending" tasks={pendingTasks} updateTask={updateTask} />
          <TaskColumn title="In Progress" tasks={progressTasks} updateTask={updateTask} />
          <TaskColumn title="Completed" tasks={completedTasks} updateTask={updateTask} />
        </div>
      </DragDropContext>

      <AddTaskModal addTask={addTask}/>
    </div>
  )
}
export default TaskPage