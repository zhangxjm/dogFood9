import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import Link from 'next/link';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">实时监控</Link>,
    },
    {
      key: '/compare',
      icon: <BarChartOutlined />,
      label: <Link href="/compare">多维度对比</Link>,
    },
    {
      key: '/report',
      icon: <FileTextOutlined />,
      label: <Link href="/report">自定义报表</Link>,
    },
    {
      key: '/products',
      icon: <ShopOutlined />,
      label: <Link href="/products">商品分析</Link>,
    },
  ];

  const getSelectedKey = () => {
    if (router.pathname === '/') return '/';
    if (router.pathname.startsWith('/room')) return '/';
    if (router.pathname.startsWith('/compare')) return '/compare';
    if (router.pathname.startsWith('/report')) return '/report';
    if (router.pathname.startsWith('/products')) return '/products';
    return router.pathname;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {collapsed ? '直播' : '直播数据监控'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, color: '#333' }}>直播数据监控平台</h2>
          <div className="realtime-badge">
            <span className="dot"></span>
            实时数据
          </div>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 180px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
