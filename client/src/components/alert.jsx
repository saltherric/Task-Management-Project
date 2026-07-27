import React from 'react'
import { Alert as AntdAlert } from 'antd';

function Alert({ alert, onClose }) {
	if (!alert) return null;

	const alertType = alert.type === 'danger' ? 'error' : alert.type;

	return (
		<AntdAlert
			className="app-alert-toast"
			type={alertType}
			message={alert.message}
			showIcon	
			closable
			onClose={onClose}
			style={{ textAlign: 'left' }}
		/>
	);
}

export default Alert
