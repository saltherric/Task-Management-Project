import React from 'react'

// Single task card (title, description, priority, status, dropdown menu)

export default function TaskCard() {
  return (
      <div className="card w-50">
        <div className="card-body">
          <h5 className="card-title">Card title</h5>
          <p className="card-text">With supporting text below as a natural lead-in to additional content.</p>
          <a href="#" className="btn btn-primary">Button</a>
        </div>
      </div>
  )
}
