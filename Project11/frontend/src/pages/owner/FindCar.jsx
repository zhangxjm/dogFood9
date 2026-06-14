import { useState } from 'react';
import { Card, Input, Button, Descriptions, Tag, message, Row, Col, Spin } from 'antd';
import { SearchOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getRecords } from '../../api';
import dayjs from 'dayjs';

export default function FindCar() {
  const [plateNumber, setPlateNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [carInfo, setCarInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!plateNumber.trim()) {
      message.warning('请输入车牌号');
      return;
    }
    setSearching(true);
    setNotFound(false);
    setCarInfo(null);
    try {
      const data = await getRecords({ plateNumber: plateNumber.trim(), status: 'PARKING' });
      const records = Array.isArray(data) ? data : data?.data || data?.records || [];
      if (records.length > 0) {
        setCarInfo(records[0]);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      message.error('查询失败');
    } finally {
      setSearching(false);
    }
  };

  const renderFloorMap = () => {
    if (!carInfo) return null;
    const floor = carInfo.floor || '1';
    const zone = carInfo.zone || 'A';
    const spotNum = carInfo.spotNumber || '';

    const spotRow = Math.ceil(parseInt(spotNum.replace(/\D/g, '') || '1') / 4);
    const spotCol = ((parseInt(spotNum.replace(/\D/g, '') || '1') - 1) % 4) + 1;

    return (
      <div
        style={{
          background: '#f5f5f5',
          borderRadius: 8,
          padding: 16,
          position: 'relative',
          minHeight: 200,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8, fontWeight: 'bold' }}>
          {floor}层 {zone}区
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {Array.from({ length: 20 }, (_, i) => {
            const num = i + 1;
            const isTarget = num.toString() === spotNum.replace(/\D/g, '') || spotNum.includes(num.toString());
            return (
              <div
                key={i}
                style={{
                  height: 32,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  background: isTarget ? '#1677ff' : '#d9d9d9',
                  color: isTarget ? '#fff' : '#666',
                  fontWeight: isTarget ? 'bold' : 'normal',
                  transition: 'all 0.3s',
                  animation: isTarget ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {num}
              </div>
            );
          })}
        </div>
        {carInfo.spotNumber && (
          <Tag
            color="blue"
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: 14,
              padding: '4px 12px',
            }}
          >
            您的车在 {spotNum} 号车位
          </Tag>
        )}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          <EnvironmentOutlined style={{ marginRight: 8 }} />
          寻车导航
        </h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input
            placeholder="请输入车牌号"
            prefix={<SearchOutlined />}
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            onPressEnter={handleSearch}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={handleSearch} loading={searching}>
            查找
          </Button>
        </div>

        {notFound && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
            未找到该车辆的停车记录，请确认车牌号是否正确
          </div>
        )}

        {carInfo && (
          <div>
            {renderFloorMap()}
            <Descriptions
              column={1}
              size="small"
              bordered
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label="车牌号">
                <Tag color="blue">{carInfo.plateNumber}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车位编号">{carInfo.spotNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="楼层">{carInfo.floor ? `${carInfo.floor}层` : '-'}</Descriptions.Item>
              <Descriptions.Item label="区域">{carInfo.zone ? `${carInfo.zone}区` : '-'}</Descriptions.Item>
              <Descriptions.Item label="入场时间">
                {carInfo.entryTime ? dayjs(carInfo.entryTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="已停时长">
                {carInfo.entryTime
                  ? dayjs().diff(dayjs(carInfo.entryTime), 'hour', true).toFixed(1) + '小时'
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Button type="primary" block style={{ marginTop: 12 }} icon={<EnvironmentOutlined />}>
              导航前往
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
