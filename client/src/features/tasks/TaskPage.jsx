import React, { useEffect, useState } from 'react'
import TaskColumn from '../../components/TaskColumn'
import AddTaskModal from '../../components/AddTaskModal'
import { DragDropContext } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import { addTask, updateTask, changeStatus, deleteTask } from "./taskSlice";
import Alert from '../../components/alert';
import { logout } from '../auth/authSlice';
import { Navigate } from 'react-router-dom';

// Main page

function TaskPage() {
  const [alert, setAlert] = useState(null);

  const tasks = useSelector(
    state => state.tasks.tasks // to get data from redux
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!alert) return;

    const timerId = setTimeout(() => {
      setAlert(null);
    }, 2500); 

    return () => clearTimeout(timerId);
  }, [alert]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleAddTask = (newTask) => {
    dispatch(addTask(newTask));
    showAlert('success', 'Task created successfully.');
  };

  const handleUpdateTask = (updatedTask) => {
    dispatch(updateTask(updatedTask));
    showAlert('info', 'Task updated successfully.');
  };

  const handleDeleteTask = (task) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (!isConfirmed) return;

    dispatch(deleteTask(task.id));
    showAlert('danger', `Task deleted successfully.`);
  };

  const handleDragEnd = (result) => {
    if(!result.destination) return;
    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId;
    dispatch(changeStatus({ id: taskId, status: newStatus }));
  }

  const handleLogout = () => {
    dispatch(logout());
    Navigate("/login");
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

      <Alert alert={alert} onClose={() => setAlert(null)} />

      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1>Task Manager</h1>
        <button className="btn btn-danger" onClick={handleLogout}> Logout </button>
      </div>

      <div className="d-flex justify-content-end mb-4">
        <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal"> 
          Add New Task
        </button>
      </div>
  
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="row g-4">
          <TaskColumn title="Pending" tasks={pendingTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} />
          <TaskColumn title="In Progress" tasks={progressTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} />
          <TaskColumn title="Completed" tasks={completedTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} />
        </div>
      </DragDropContext>

      <AddTaskModal addTask={handleAddTask}/>
    </div>
  )
}
export default TaskPage