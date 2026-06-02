import React, { useEffect, useState } from 'react'
import TaskColumn from '../components/TaskColumn'
import AddTaskModal from '../components/AddTaskModal'
import { DragDropContext } from '@hello-pangea/dnd';
import Alert from '../components/alert';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditTaskModal from '../components/EditTaskModal';
import Navbar from '../components/navbar/Navbar';
import { getAuthHeaders, getStoredUserInfo } from '../helpers/auth';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

// Main page

function BoardPage() {
  const [alert, setAlert] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
      fetchTasks();
  }, []);

  // Check for pending alert from previous page (Login)
  useEffect(() => {
    const pendingAlert = localStorage.getItem('pendingAlert');
    if (pendingAlert) {
      setAlert(JSON.parse(pendingAlert));
      localStorage.removeItem('pendingAlert');
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const userInfo = getStoredUserInfo();

      if (!userInfo?.token) {
        navigate('/login');
        return;
      }

      const response = await API.get('/tasks', {
        headers: getAuthHeaders(),  
      });
      setTasks(response.data);
    } catch (error) {
      console.log(error);
    }
  }

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

  const modalId = "editTaskModal";

  const handleAddTask = () => {
  fetchTasks();
    showAlert('success', 'Task created successfully.');
  };

  const handleUpdateTask = () => {
  fetchTasks();
    showAlert('info', 'Task updated successfully.');
  };

  const handleDeleteTask = () => {
    fetchTasks();
    showAlert('danger', `Task deleted successfully.`);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task._id === taskId ? { ...task, status: newStatus } : task
      );
      // Move the updated task to the end
      const movedTask = updatedTasks.find(task => task._id === taskId);
      const otherTasks = updatedTasks.filter(task => task._id !== taskId);
      return [...otherTasks, movedTask];
    });
    
    try {
      await API.put(`/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: getAuthHeaders(),
        }
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchTasks();
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  }

  return (
    <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Board</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          This page is now only responsible for board content. The shared navbar and sidebar live in
          the protected layout.
        </p>
      </div>

      {/* <Navbar/>
      <Sidebar/>
      <Alert alert={alert}/> */}
      {/* <div className="task-page-container">
        
        <div className="d-flex justify-content-end mb-4">
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal"> 
            Add New Task
          </button>
        </div>
    
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-board">
              <TaskColumn title="Pending" tasks={pendingTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
              <TaskColumn title="In Progress" tasks={progressTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
              <TaskColumn title="Completed" tasks={completedTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
          </div>
          
        </DragDropContext>
        <AddTaskModal addTask={handleAddTask}/>
        <EditTaskModal task={selectedTask} updateTask={handleUpdateTask} modalId={modalId}/>
      </div> */}
    </>
  )
  
}
export default BoardPage