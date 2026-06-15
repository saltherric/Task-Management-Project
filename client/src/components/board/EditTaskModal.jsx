import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '../../helpers/auth';

// Bootstrap modal for editing task

function EditTaskModal({ task, updateTask, modalId }) {
  const closeButton = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "Low");
      setStatus(task.status || "Pending");
      return;
    }

    setTitle("");
    setDescription("");
    setPriority("Low");
    setStatus("Pending");
  }, [task]); // only run when task changes

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!task || !isChanged) return;

    const updatedData = {
      title,
      description,
      priority,
      status
    }
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        updatedData,
        { headers: getAuthHeaders() }
      );
      if (updateTask && response.data) {
        updateTask(response.data);
      }
      
    closeButton.current.click();
      
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };
  
  const isChanged = !!task && (
    task.title !== title ||
    task.description !== description ||
    task.priority !== priority ||
    task.status !== status
  );

  

  return (
    <div className="modal fade" id={modalId} tabIndex={-1} data-bs-backdrop = "static" data-bs-keyboard="false">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Task</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ref={closeButton}></button>
          </div>

          <div className="modal-body">
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-12">
                <label className="form-label">Title<span className='text-danger'>*</span></label>
                <input type="text" className="form-control" value={title} 
                  onChange={(e) => setTitle(e.target.value)} required 
                />
              </div>
              
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={description} 
                  onChange={(e) => setDescription(e.target.value)}>
                </textarea>
              </div>

              <div className="col-12">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="col-12 d-md-flex justify-content-md-end">
                <button type="button" className="btn btn-secondary btn-sm me-md-2" data-bs-dismiss="modal">
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={!isChanged}>
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal