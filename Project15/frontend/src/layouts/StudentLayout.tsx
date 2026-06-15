import React from 'react';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  ScheduleOutlined,
  BookOutlined,
  RiseOutlined,
  BarChartOutlined,
  BulbOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/student', icon: <DashboardOutlined />, label: '学习首页' },
  { key: '/student/exams', icon: <ScheduleOutlined />, label: '我的考试' },
  { key: '/student/wrong-book', icon: <BookOutlined />, label: '错题本' },
  { key: '/student/progress', icon: <RiseOutlined />, label: '学习进度' },
  { key: '/student/knowledge', icon: <BarChartOutlined />, label: '知识点分析' },
  { key: '/student/practice', icon: <BulbOutlined />, label: '个性化练习' },
];

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const selectedKey = menuItems.find(
    (m) => location.pathname === m.key || location.pathname.startsWith(m.key + '/')
  )?.key || '/student';

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
            color: '#52c41a',
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
          <div style={{ fontSize: 16, fontWeight: 600 }}>学生学习平台</div>
          <Dropdown menu={{ items: userDropdown }} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <Avatar size={36} icon={<UserOutlined />} style={{ background: '#52c41a' }} />
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

export default StudentLayout;
