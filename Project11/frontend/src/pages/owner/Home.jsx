import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Button, Statistic, Tag, Space, Spin, message } from 'antd';
import {
  CarOutlined,
  SafetyCertificateOutlined,
  CompassOutlined,
  PayCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSpotsSummary, getCurrentParked, createParkingWebSocket } from '../../api';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [currentParked, setCurrentParked] = useState(null);
  const navigate = useNavigate();
  const wsRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [summaryData, parkedData] = await Promise.all([getSpotsSummary(), getCurrentParked()]);
      setSummary(summaryData || {});
      const parked = Array.isArray(parkedData) ? parkedData : parkedData?.data || [];
      setCurrentParked(parked.length > 0 ? parked[0] : null);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    wsRef.current = createParkingWebSocket((msg) => {
      if (msg.type === 'SPOT_UPDATE' || msg.type === 'VEHICLE_ENTRY' || msg.type === 'VEHICLE_EXIT') {
        fetchData();
      }
    });

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchData]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const freeSpots = summary.free || 0;
  const totalSpots = summary.total || summary.totalSpots || 0;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12, marginBottom: 16, background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)', border: 'none' }}>
        <div style={{ color: '#fff', textAlign: 'center' }}>
          <EnvironmentOutlined style={{ fontSize: 32, marginBottom: 8 }} />
          <h2 style={{ color: '#fff', margin: '0 0 8px' }}>智慧停车场</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>实时车位信息</p>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 0' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{freeSpots}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>空闲车位</div>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 0' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{totalSpots}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>总车位</div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>

      {currentParked && (
        <Card style={{ borderRadius: 12, marginBottom: 16, borderColor: '#1677ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Tag color="blue">停车中</Tag>
              <span style={{ fontWeight: 'bold', marginLeft: 8 }}>{currentParked.plateNumber}</span>
            </div>
            <Button type="primary" size="small" onClick={() => navigate('/owner/payment')}>
              去支付
            </Button>
          </div>
          <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
            <div>车位：{currentParked.spotNumber || '-'}</div>
            <div>入场时间：{currentParked.entryTime || '-'}</div>
          </div>
        </Card>
      )}

      <Row gutter={[12, 12]}>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/owner/reserve')}
            hoverable
          >
            <CarOutlined style={{ fontSize: 28, color: '#1677ff' }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>预约车位</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/owner/find')}
            hoverable
          >
            <CompassOutlined style={{ fontSize: 28, color: '#52c41a' }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>寻车导航</div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/owner/payment')}
            hoverable
          >
            <PayCircleOutlined style={{ fontSize: 28, color: '#faad14' }} />
            <div style={{ marginTop: 8, fontSize: 13 }}>无感支付</div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
