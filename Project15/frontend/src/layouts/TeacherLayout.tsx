import React, { ReactNode } from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ReadOutlined,
  ScheduleOutlined,
  BulbOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/teacher', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/teacher/questions', icon: <FileTextOutlined />, label: '题目管理' },
  { key: '/teacher/papers', icon: <ReadOutlined />, label: '试卷管理' },
  { key: '/teacher/exams', icon: <ScheduleOutlined />, label: '考试管理' },
  { key: '/teacher/knowledge', icon: <BulbOutlined />, label: '知识点管理' },
];

const TeacherLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = menuItems.find(
    (m) => location.pathname === m.key || location.pathname.startsWith(m.key + '/')
  )?.key || '/teacher';

  const userDropdown = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login', { replace: true });
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#1677ff',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          🎓 在线考试系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0, padding: '8px 0' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600 }}>教师管理平台</div>
          <Dropdown menu={{ items: userDropdown }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <Avatar size={36} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <span style={{ fontSize: 14, color: '#333' }}>{user?.realName || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, minHeight: 'calc(100vh - 64px)' }}>
          <div
            style={{
              padding: 24,
              background: '#f5f7fa',
              minHeight: '100%',
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default TeacherLayout;
