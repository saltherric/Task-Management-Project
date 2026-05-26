import React from 'react'
import { Alert as AntdAlert } from 'antd';

function Alert({ alert }) {
	if (!alert) return null;

	const alertType = alert.type === 'danger' ? 'error' : alert.type;

	return (
		<AntdAlert
			className="app-alert-toast"
			type={alertType}
			title={alert.message}
			showIcon	
			style={{ textAlign: 'left' }}
		/>
	);
}

export default Alert
