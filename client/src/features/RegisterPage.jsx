import React, { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Input } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import API from '../services/api';
import { useAlert } from '../contexts/AlertContext';

function Register() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleSubmit = async (values) => {
    try {
      const { username, email, password } = values;
      const user = {
        username,
        email,
        password
      }
      const response = await API.post('/auth/register', user);
      console.log(response.data);

      // Registration should not authenticate the user.
      localStorage.removeItem('userInfo');
     
      showAlert('Registered successfully. Please check your email to verify your account.', 'success');
      navigate('/login');
      
    } catch (error) {
      console.log(error.response?.data);
      const backendMessage = error.response?.data?.message;
      showAlert(backendMessage || 'Registration failed.', 'danger');
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="bg-(--color-card) backdrop-blur-[10px] border border-indigo-600/10 rounded-3xl py-10 px-[35px] w-full max-w-[420px] text-center shadow-[0_8px_32px_rgba(30,41,59,0.10)]">
        <h1 className="mb-9 pb-4 text-4xl font-semibold">Register</h1>
        <p className="register-subtitle">Create your account to start managing tasks.</p>

        <Form
          name="register_form"
          onFinish={handleSubmit}
          requiredMark={false} // Hides the red asterisks
          layout="vertical"
          className="space-y-4"
        >
          {/* Username Input */}
          <Form.Item name="username" rules={[{ required: true, message: 'Please input your Full name!' }]}>
            <Input prefix={<UserOutlined className="input-icon" />} placeholder="Full name" 
              className="antd-custom-input"
            />
          </Form.Item>

          {/* Email Input */}
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your Email!' }]}>
            <Input prefix={<MailOutlined className="input-icon" />} placeholder="Email" 
              className="antd-custom-input"
            />
          </Form.Item>

          {/* Password Input */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password 
              placeholder="Password" 
              prefix={<LockOutlined className="input-icon" />} 
              className="antd-custom-input"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType='submit' className="login-button" >
              Register
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <p className="mt-6 text-sm text-(--color-muted)">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
