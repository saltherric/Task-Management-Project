// import React, { useEffect, useState } from 'react'
// import TaskColumn from '../components/board/TaskColumn'
// import AddTaskModal from '../components/board/AddTaskModal'
// import { DragDropContext } from '@hello-pangea/dnd';
// import Alert from '../components/alert';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import EditTaskModal from '../components/board/EditTaskModal';
// import Navbar from '../components/navbar/Navbar';
// import { getAuthHeaders, getStoredUserInfo } from '../helpers/auth';
// import API from '../services/api';
// import getTasksByProject from '../services/taskApi';
// import { useParams } from "react-router-dom";
// import BoardHeader from "../components/board/BoardHeader";
// import KanbanBoard from "../components/board/Board";

// // Main page

// function BoardPage() {
//   const [alert, setAlert] = useState(null);
//   const [project, setProject] = useState(null);
//   const [columns, setColumns] = useState([]);
//   const [tasks, setTasks] = useState([]);
//   // const [selectedTask, setSelectedTask] = useState(null);

//   const navigate = useNavigate();
//   const { projectId } = useParams();

//   useEffect(() => {
//     if(projectId){
//       fetchProject();
//       fetchColumns();
//       fetchTasks();
//     }
//    }, [projectId]);

//   const fetchProject = async(projectId) => {
//     try{
//       const response = await API.get(
//         `/projects/${projectId}`,
//         {
//             headers: getAuthHeaders(),
//         }
//       );
//       setProject(response.data.project);
//     }catch(error){
//       console.error(error);
//     }
//   }

//   const fetchTasks = async (projectId) => {
//     try {
//       const userInfo = getStoredUserInfo();

//       if (!userInfo?.token) {
//         navigate('/login');
//         return;
//       }

//       const data = await getTasksByProject(projectId);
//       const taskList = data.tasks;
//       setTasks(taskList);
//     } catch (error) {
//       console.log(error);
//     }
//   }

//   const fetchColumns = async (projectId) => {
//     try {

//         const response = await API.get(
//           `/columns/projects/${projectId}`,
//           {
//               headers: getAuthHeaders(),
//           }
//         );

//         setColumns(response.data.columns);

//     } catch (error) {
//         console.error(error);
//     }
//   };

//   // Check for pending alert from previous page (Login)
//   useEffect(() => {
//     const pendingAlert = localStorage.getItem('pendingAlert');
//     if (pendingAlert) {
//       setAlert(JSON.parse(pendingAlert));
//       localStorage.removeItem('pendingAlert');
//     }
//   }, []);

//   useEffect(() => {
//     if (!alert) return;

//     const timerId = setTimeout(() => {
//       setAlert(null);
//     }, 2500); 

//     return () => clearTimeout(timerId);
//   }, [alert]);

//   const showAlert = (type, message) => {
//     setAlert({ type, message });
//   };

//   const modalId = "editTaskModal";

//   const handleAddTask = () => {
//   fetchTasks(projectId);
//     showAlert('success', 'Task created successfully.');
//   };

//   const handleUpdateTask = () => {
//   fetchTasks(projectId);
//     showAlert('info', 'Task updated successfully.');
//   };

//   const handleDeleteTask = () => {
//     fetchTasks(projectId);
//     showAlert('danger', `Task deleted successfully.`);
//   };

//   const handleOpenEditModal = (task) => {
//     setSelectedTask(task);
//   }

//   const handleDragEnd = async (result) => {
//     if (!result.destination) return;
    
//     const taskId = result.draggableId;
//     const newStatus = result.destination.droppableId;
    
//     setTasks(prevTasks => {
//       const updatedTasks = prevTasks.map(task =>
//         task._id === taskId ? { ...task, status: newStatus } : task
//       );
//       // Move the updated task to the end
//     //   const movedTask = updatedTasks.find(task => task._id === taskId);
//     //   const otherTasks = updatedTasks.filter(task => task._id !== taskId);
//     //   return [...otherTasks, movedTask];
//     });
//   }
//   const handleLogout = () => {
//     localStorage.removeItem("userInfo");
//     navigate("/login");
//   }

//   return (
//     <>
//       <div className="p-6">
//         <BoardHeader
//             project={project}
//         />
//         <Board
//             columns={columns}
//             tasks={tasks}
//         />
//       </div>

//       {/* <DragDropContext onDragEnd={handleDragEnd}>
//         <div className="task-board">
//             <KanbanBoard
//               columns={columns}
//               tasks={tasks}
//               updateTask={handleUpdateTask}
//               deleteTask={handleDeleteTask}
//               openEditModal={handleOpenEditModal}
//               modalId={modalId}
//             />
//         </div>
//       </DragDropContext> */}

//         {/* <TaskColumn /> */}

//       {/* <Alert alert={alert}/> 
//       <div className="task-page-container">
        
//         <div className="d-flex justify-content-end mb-4">
//           <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addTaskModal"> 
//             Add New Task
//           </button>
//         </div>
//         <AddTaskModal addTask={handleAddTask}/>
//         <EditTaskModal task={selectedTask} updateTask={handleUpdateTask} modalId={modalId}/>
//       </div> */}
//     </>
//   )
  
// }
// export default BoardPage