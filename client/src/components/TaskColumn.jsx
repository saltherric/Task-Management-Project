import React from 'react'
import TaskCard from "./TaskCard";
import { Droppable } from '@hello-pangea/dnd';

// each task column

function TaskColumn(props) {
  return (
    <div className="col-md-4">
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between">
          <h5>{props.title}</h5>
          <span className={`badge ${
            props.title === "Pending" ? "bg-danger" : props.title === "In Progress" ? "bg-primary" : "bg-success"
          }`}>
            {props.tasks.length}
          </span>
        </div>
        
        <Droppable droppableId={props.title}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="card-body" >
              {
                props.tasks.map((task, index) => (
                  <TaskCard 
                    key={task._id}
                    task={task} 
                    updateTask={props.updateTask}
                    deleteTask={props.deleteTask}
                    index={index}
                  />
                ))
              }
              {provided.placeholder}  
            </div>
          )}

        </Droppable>
        
      </div>
    </div>
  );
}

export default TaskColumn;
