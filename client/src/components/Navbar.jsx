import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    // State for search query
    const [searchQuery, setSearchQuery] = useState('');
    
    const navigate = useNavigate();

    // State for notifications
    const [notifications, setNotifications] = useState([
        { id: 1, text: "New task assigned: 'Database migration'", time: "5m ago", read: false },
        { id: 2, text: "Sarah commented on your task 'Design feedback'", time: "1h ago", read: false },
        { id: 3, text: "Project 'TaskMe Redesign' deadline updated", time: "3h ago", read: false }
    ]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    // Sample tasks to demonstrate the interactive search bar
    const [tasks, setTasks] = useState([
        { id: 1, title: "Implement dark mode support", category: "UI/UX", status: "In Progress", priority: "High" },
        { id: 2, title: "Refactor API authentication flow", category: "Backend", status: "To Do", priority: "Critical" },
        { id: 3, title: "Write end-to-end testing suite", category: "QA", status: "Done", priority: "Medium" },
        { id: 4, title: "Create product pitch slides", category: "Marketing", status: "In Progress", priority: "Low" },
        { id: 5, title: "Update Bootstrap 5 dependency guidelines", category: "Documentation", status: "To Do", priority: "Medium" }
    ]);

    // Note: Bootstrap CSS should be included globally (index.html or main entry)

    // Filter tasks based on search query in the navbar
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo")
    navigate("/login");
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom py-2 px-3 sticky-top shadow-sm">
        <div className="container-fluid d-flex align-items-center justify-content-between">
          
          {/* Brand Logo & Name */}
          <div className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
            {/* Styled Logo matching the image check+ circle */}
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle me-2 brand-logo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Thick Checkmark */}
                <path d="M5 12L10 17L19 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Small plus attached to the checkmark corner */}
                <path d="M19 13V19M16 16H22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="fs-4 fw-bold text-dark brand-text">TaskMe</span>
          </div>

          {/* Interactive Search Bar (Centered visually, responsive size) */}
          <div className="flex-grow-1 mx-3 mx-md-5 navbar-search">
            <div className="position-relative">
              <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted search-icon">
                {/* Search Icon SVG */}
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                className="form-control border-0 rounded-pill py-2 ps-5 pe-3 text-secondary navbar-search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 text-muted border-0 shadow-none text-decoration-none search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="d-flex align-items-center gap-3">
            
            {/* Notification Bell with Dropdown */}
            <div className="position-relative">
              <button 
                className="btn btn-link p-1 text-secondary border-0 shadow-none position-relative" 
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowProfileDropdown(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Bell Icon SVG */}
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {/* Red Circular Badge */}
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute translate-middle badge rounded-circle bg-danger border border-white d-flex align-items-center justify-content-center notif-badge"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotifDropdown && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border p-2 notif-dropdown"
                >
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2 px-2">
                    <span className="fw-bold text-dark small">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button className="btn btn-link p-0 text-decoration-none text-primary small" style={{ fontSize: '12px' }} onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-muted small">No notifications found</div>
                  ) : (
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded mb-1 d-flex justify-content-between align-items-start transition ${notif.read ? 'bg-white' : 'bg-light'}`}
                        >
                          <div>
                            <p className="mb-0 text-dark small" style={{ lineHeight: '1.3' }}>{notif.text}</p>
                            <span className="text-muted" style={{ fontSize: '10px' }}>{notif.time}</span>
                          </div>
                          <button 
                            className="btn btn-link text-muted p-0 ms-2 text-decoration-none" 
                            style={{ fontSize: '14px' }} 
                            onClick={() => removeNotification(notif.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar Profile Indicator */}
            <div className="position-relative">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold avatar"
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifDropdown(false);
                }}
              >
                CA
              </div>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && (
                <div 
                  className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border p-3 profile-dropdown"
                >
                  <div className="text-center border-bottom pb-3 mb-2">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-2 profile-dropdown-avatar"
                    >
                      CA
                    </div>
                    <h6 className="mb-0 text-dark fw-bold">Charles Austin</h6>
                    <small className="text-muted">charles.austin@taskme.com</small>
                  </div>
                  <div className="d-grid gap-1">
                    <button className="btn btn-sm btn-outline-secondary border-0 text-start">My Settings</button>
                    <button className="btn btn-sm btn-outline-secondary border-0 text-start">Workspace Admin</button>
                    <button className="btn btn-sm btn-outline-danger border-0 text-start mt-2" onClick={handleLogout}>Log out</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>
    </div>
  )
}
