import React from 'react'
import EditTaskModal from './EditTaskModal';
import { Draggable } from '@hello-pangea/dnd';

// Single task card (title, description, priority, status, dropdown menu)

function TaskCard({ task, updateTask, index }) {
  const modalId = `editTaskModal-${task.id}`;

  return (
    <Draggable 
      draggableId={String(task.id)}
      index={index}
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
                <h5 className="card-title mb-0">{task.title}</h5>
                <div className="dropdown">
                  <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button className="dropdown-item" data-bs-toggle="modal" data-bs-target={`#${modalId}`}>Edit</button></li>
                    <li><button className="dropdown-item text-danger">Delete</button></li>
                  </ul>
                </div>
              </div>
              
              <p className="card-text">{task.description}</p>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className={`badge text-dark px-3 py-2 ${
                  task.priority === "High" ? "bg-success" : task.priority === "Medium" ? "bg-primary" : "bg-danger"
                }`} 
                >
                  {task.priority}
                </span>
                
                <span className={`badge px-3 py-2 ${
                    task.status === "Completed" ? "bg-success" : task.status === "In Progress" ? "bg-primary" : "bg-danger"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
            <EditTaskModal task={task} updateTask={updateTask} modalId={modalId}/>
          </div>
        </div>
      )}
      
    </Draggable>
    
  );
}
export default TaskCard