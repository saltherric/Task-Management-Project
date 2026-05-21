import React, { useEffect, useState } from 'react'
import TaskColumn from '../../components/TaskColumn'
import AddTaskModal from '../../components/AddTaskModal'
import { DragDropContext } from '@hello-pangea/dnd';
import Alert from '../../components/Alert';
import { useNavigate } from 'react-router-dom';
import EditTaskModal from '../../components/EditTaskModal';
import { getAuthHeaders, getStoredUserInfo } from '../../helpers/auth';
import API from '../../api/axios';
import Navbar from '../../components/Navbar';

// Main page

function TaskPage() {
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
      // console.log(getStoredUserInfo());
      // console.log(getAuthHeaders());
      const response = await API.get("/tasks",
        {
          headers: getAuthHeaders(),
        }
      );
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
        { headers: getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      fetchTasks();
    }
  }

  // const handleLogout = () => {
  //   // Clear local auth and go to login 
  //   localStorage.removeItem("userInfo");
  //   navigate("/login");
  // }

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
    <>
      <Navbar />
      <div className="container py-4">  
        <Alert alert={alert} onClose={() => setAlert(null)} />
        {/* <div className="d-flex justify-content-between align-items-center mb-5">
          <h1>Task Manager</h1>
          <button className="btn btn-danger" onClick={handleLogout}> Logout </button>
        </div> */}

        <div className="d-flex justify-content-end mb-4">
          <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal"> 
            Add New Task
          </button>
        </div>
    
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="row g-4">
            <TaskColumn title="Pending" tasks={pendingTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
            <TaskColumn title="In Progress" tasks={progressTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
            <TaskColumn title="Completed" tasks={completedTasks} updateTask={handleUpdateTask} deleteTask={handleDeleteTask} openEditModal={handleOpenEditModal} modalId={modalId}/>
          </div>
        </DragDropContext>

        <AddTaskModal addTask={handleAddTask}/>
        <EditTaskModal task={selectedTask} updateTask={handleUpdateTask} modalId={modalId}/>
      </div>
    </>
  
  )
}
export default TaskPage