import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  AlertOutlined,
  DesktopOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../pages/admin/Dashboard';
import ParkingMap from '../pages/admin/ParkingMap';
import VehicleManagement from '../pages/admin/VehicleManagement';
import BillingManagement from '../pages/admin/BillingManagement';
import MonthlyRentalManagement from '../pages/admin/MonthlyRentalManagement';
import AlertCenter from '../pages/admin/AlertCenter';
import HardwareMonitor from '../pages/admin/HardwareMonitor';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/admin/parking-map', icon: <CarOutlined />, label: '车位管理' },
  { key: '/admin/vehicles', icon: <TeamOutlined />, label: '车辆管理' },
  { key: '/admin/billing', icon: <DollarOutlined />, label: '计费管理' },
  { key: '/admin/monthly', icon: <CalendarOutlined />, label: '月租管理' },
  { key: '/admin/alerts', icon: <AlertOutlined />, label: '告警中心' },
  { key: '/admin/hardware', icon: <DesktopOutlined />, label: '设备监控' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuItems = [
    { key: 'profile', label: '个人设置' },
    { key: 'logout', label: '退出登录' },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      navigate('/owner');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '停车' : '智慧停车管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(false)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() => setCollapsed(true)}
              />
            )}
            <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 500 }}>
              智慧停车管理系统 - 管理后台
            </span>
          </div>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="parking-map" element={<ParkingMap />} />
            <Route path="vehicles" element={<VehicleManagement />} />
            <Route path="billing" element={<BillingManagement />} />
            <Route path="monthly" element={<MonthlyRentalManagement />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="hardware" element={<HardwareMonitor />} />
            <Route path="" element={<Dashboard />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
