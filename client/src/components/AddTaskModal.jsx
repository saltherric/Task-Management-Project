import React from 'react'
import { useState } from 'react';

// modal for adding new task

function AddTaskModal({addTask}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("Pending");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTask = {
      id: Date.now(),
      title,
      description,
      priority,
      status
    };

    addTask(newTask);

    setTitle("");
    setDescription("");
    setPriority("Low");
    setStatus("Pending");
  };

  return (
    <>
    <div className="modal fade" id="addTaskModal" tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Task</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          
          <div className="modal-body">
            <form className="row g-3" onSubmit={handleSubmit}>

              <div className="col-12">
                <label className="form-label">Title<span className='text text-danger'>*</span></label>
                <input type="text" className="form-control" value={title}  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
              </div>
              <div className="col-12">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="col-12 d-md-flex justify-content-md-end">
                <button type="button" className="btn btn-secondary btn-sm me-md-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" data-bs-dismiss="modal">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
export default AddTaskModal