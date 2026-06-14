import { Layout } from 'antd';
import {
  HomeOutlined,
  CarOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from '../pages/owner/Home';
import ReserveSpot from '../pages/owner/ReserveSpot';
import FindCar from '../pages/owner/FindCar';
import MyPage from '../pages/owner/MyPage';
import Payment from '../pages/owner/Payment';

const { Content, Footer } = Layout;

const tabs = [
  { key: '/owner', icon: <HomeOutlined />, label: '首页' },
  { key: '/owner/reserve', icon: <CarOutlined />, label: '预约车位' },
  { key: '/owner/find', icon: <SearchOutlined />, label: '寻车' },
  { key: '/owner/my', icon: <UserOutlined />, label: '我的' },
];

export default function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.key))?.key || '/owner';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ paddingBottom: 60 }}>
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="reserve" element={<ReserveSpot />} />
          <Route path="find" element={<FindCar />} />
          <Route path="my" element={<MyPage />} />
          <Route path="payment" element={<Payment />} />
        </Routes>
      </Content>
      <Footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 0,
          background: '#fff',
          borderTop: '1px solid #e8e8e8',
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: 56,
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                color: activeTab === tab.key ? '#1677ff' : '#999',
                fontSize: 12,
                gap: 2,
              }}
            >
              <span style={{ fontSize: 20 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>
      </Footer>
    </Layout>
  );
}
