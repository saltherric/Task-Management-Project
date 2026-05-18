import React, { useState, useRef } from 'react'
import axios from "axios";

// modal for adding new task

function AddTaskModal({addTask}) {
  const closeButton = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'Pending'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'Low',
      status: 'Pending'
    });
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/tasks", formData);

      // Inform parent of new task if callback provided
      if (addTask && response && response.data) {
        addTask(response.data);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'Low',
        status: 'Pending'
      });

      closeButton.current.click();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };
  
  return (
    <>
    <div className="modal fade" id="addTaskModal" tabIndex={-1} data-bs-backdrop = "static" data-bs-keyboard="false">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add New Task</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ref={closeButton}></button>
          </div>
          
          <div className="modal-body">
            <form className="row g-3" onSubmit={handleSubmit}>

              <div className="col-12">
                <label className="form-label">Title<span className='text text-danger'>*</span></label>
                <input type="text" className="form-control" name='title' value={formData.title}  onChange={handleChange}
                  required 
                />
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea className="form-control" name='description' value={formData.description} onChange={handleChange}></textarea>
              </div>
              <div className="col-12">
                <label className="form-label">Priority</label>
                <select className="form-select" name='priority' value={formData.priority} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Status</label>
                <select className="form-select" name='status' value={formData.status} onChange={handleChange}>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              <div className="col-12 d-md-flex justify-content-md-end">
                <button type="button" className="btn btn-secondary btn-sm me-md-2" data-bs-dismiss="modal" onClick={resetForm} ref={closeButton}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Task</button>
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