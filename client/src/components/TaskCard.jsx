import React from 'react'
import EditTaskModal from './EditTaskModal';
import { Draggable } from '@hello-pangea/dnd';
import axios from 'axios';

// Single task card (title, description, priority, status, dropdown menu)

function TaskCard(props) {
  const modalId = `editTaskModal-${props.task._id}`;

  const handleDeleteClick = async () => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${props.task.title}"?`);
    if (!isConfirmed) return;
    
    try {
      const respone = await axios.delete(`http://localhost:5000/api/tasks/${props.task._id}`);
      if (props.deleteTask){
        props.deleteTask();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } 
  };

  return (
    <Draggable 
      draggableId={String(props.task._id)}
      index={props.index}
    >
      {(provided) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="card shadow-sm mb-3">
            <div className="card-body">

              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">{props.task.title}</h5>
                <div className="dropdown">
                  <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target={`#${modalId}`}>Edit</button></li>
                    <li><button className="dropdown-item text-danger" onClick={handleDeleteClick}>Delete</button></li>
                  </ul>
                </div>
              </div>
              
              <p className="card-text">{props.task.description}</p>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className={`badge text-dark px-3 py-2 ${
                  props.task.priority === "High" ? "bg-success" : props.task.priority === "Medium" ? "bg-primary" : "bg-danger"
                }`} 
                >
                  {props.task.priority}
                </span>
                
                <span className={`badge px-3 py-2 ${
                    props.task.status === "Completed" ? "bg-success" : props.task.status === "In Progress" ? "bg-primary" : "bg-danger"
                  }`}
                >
                  {props.task.status}
                </span>
              </div>
            </div>
            <EditTaskModal task={props.task} updateTask={props.updateTask} modalId={modalId}/>
          </div>
        </div>
      )}
      
    </Draggable>
    
  );
}
export default TaskCard