import React from 'react'

function Alert({ alert, onClose }) {
	if (!alert) return null;

	return (
		<div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
			{alert.message}
			<button type="button" className="btn-close" aria-label="Close" onClick={onClose} ></button>
		</div>
	);
}

export default Alert
