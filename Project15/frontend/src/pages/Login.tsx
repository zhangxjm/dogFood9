import React, { useState } from 'react';
import { Form, Input, Button, Card, Radio, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, LoginParams } from '../api';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginParams) => {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      login(res.data.token, res.data.userInfo);
      message.success('登录成功');
      navigate(res.data.userInfo.role === 1 ? '/teacher' : '/student', { replace: true });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
          <h2 style={{ margin: 0, color: '#333' }}>在线考试系统</h2>
          <p style={{ color: '#999', marginTop: 8 }}>欢迎登录</p>
        </div>
        <Form name="login" onFinish={onFinish} autoComplete="off" size="large" initialValues={{ role: 2 }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="role">
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio value={1}>教师</Radio>
              <Radio value={2}>学生</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Link to="/register">还没有账号？立即注册</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
