import { useState, useEffect, useCallback } from 'react';
import { Card, Select, Button, Steps, TimePicker, DatePicker, message, Row, Col, Spin, Tag, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSpots, createReservation } from '../../api';

export default function ReserveSpot() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spots, setSpots] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zones, setZones] = useState([]);
  const [availableSpots, setAvailableSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [reserveDate, setReserveDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSpots = useCallback(async () => {
    try {
      const data = await getSpots();
      const list = Array.isArray(data) ? data : data?.spots || data?.data || [];
      setSpots(list);
      const floorSet = [...new Set(list.map((s) => s.floor).filter(Boolean))];
      setFloors(floorSet);
      if (floorSet.length > 0) setSelectedFloor(floorSet[0]);
    } catch (e) {
      message.error('加载车位数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  useEffect(() => {
    if (!selectedFloor) return;
    const filtered = spots.filter((s) => s.floor === selectedFloor);
    const zoneSet = [...new Set(filtered.map((s) => s.zone).filter(Boolean))];
    setZones(zoneSet);
    if (zoneSet.length > 0) setSelectedZone(zoneSet[0]);
  }, [selectedFloor, spots]);

  useEffect(() => {
    const filtered = spots.filter(
      (s) => s.floor === selectedFloor && (!selectedZone || s.zone === selectedZone) && s.status === 'FREE'
    );
    setAvailableSpots(filtered);
    setSelectedSpot(null);
  }, [selectedFloor, selectedZone, spots]);

  const handleReserve = async () => {
    if (!selectedSpot) {
      message.warning('请选择车位');
      return;
    }
    setSubmitting(true);
    try {
      await createReservation({
        spotId: selectedSpot.id || selectedSpot.spotId,
        spotNumber: selectedSpot.spotNumber,
        floor: selectedFloor,
        zone: selectedZone,
        date: reserveDate ? dayjs(reserveDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        startTime: startTime ? dayjs(startTime).format('HH:mm') : '08:00',
        endTime: endTime ? dayjs(endTime).format('HH:mm') : '18:00',
      });
      message.success('预约成功！');
      setCurrent(3);
    } catch (e) {
      message.error('预约失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const steps = [
    { title: '选择区域' },
    { title: '选择车位' },
    { title: '选择时间' },
    { title: '完成' },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12 }}>
        <Steps current={current} size="small" items={steps} style={{ marginBottom: 24 }} />

        {current === 0 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>选择楼层</label>
              <Select
                style={{ width: '100%' }}
                value={selectedFloor}
                onChange={(v) => { setSelectedFloor(v); setCurrent(0); }}
                options={floors.map((f) => ({ label: `${f}层`, value: f }))}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>选择区域</label>
              <Select
                style={{ width: '100%' }}
                value={selectedZone}
                onChange={setSelectedZone}
                options={zones.map((z) => ({ label: `${z}区`, value: z }))}
              />
            </div>
            <Button type="primary" block onClick={() => setCurrent(1)} disabled={!selectedFloor}>
              下一步
            </Button>
          </div>
        )}

        {current === 1 && (
          <div>
            <p style={{ marginBottom: 12, color: '#666' }}>
              当前区域：{selectedFloor}层 {selectedZone}区，共 {availableSpots.length} 个空闲车位
            </p>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {availableSpots.map((spot) => (
                <Col key={spot.id || spot.spotId} span={6}>
                  <div
                    onClick={() => setSelectedSpot(spot)}
                    style={{
                      height: 48,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: selectedSpot?.id === spot.id ? '#1677ff' : '#f0f5ff',
                      color: selectedSpot?.id === spot.id ? '#fff' : '#1677ff',
                      fontWeight: 'bold',
                      fontSize: 13,
                      transition: 'all 0.2s',
                    }}
                  >
                    {spot.spotNumber || spot.id}
                  </div>
                </Col>
              ))}
              {availableSpots.length === 0 && (
                <Col span={24}>
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>该区域暂无空闲车位</div>
                </Col>
              )}
            </Row>
            <Space style={{ width: '100%' }}>
              <Button onClick={() => setCurrent(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrent(2)} disabled={!selectedSpot} style={{ flex: 1 }}>
                下一步
              </Button>
            </Space>
          </div>
        )}

        {current === 2 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>预约日期</label>
              <DatePicker
                style={{ width: '100%' }}
                value={reserveDate}
                onChange={setReserveDate}
                disabledDate={(d) => d && d < dayjs().startOf('day')}
              />
            </div>
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>开始时间</label>
                <TimePicker format="HH:mm" value={startTime} onChange={setStartTime} style={{ width: '100%' }} />
              </Col>
              <Col span={12}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>结束时间</label>
                <TimePicker format="HH:mm" value={endTime} onChange={setEndTime} style={{ width: '100%' }} />
              </Col>
            </Row>
            <Card size="small" style={{ marginBottom: 16, background: '#f6ffed' }}>
              <p style={{ margin: 0 }}><strong>预约信息确认</strong></p>
              <p style={{ margin: '4px 0', color: '#666' }}>
                车位：{selectedFloor}层 {selectedZone}区 {selectedSpot?.spotNumber || selectedSpot?.id}
              </p>
              <p style={{ margin: '4px 0', color: '#666' }}>
                日期：{reserveDate ? dayjs(reserveDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}
              </p>
              <p style={{ margin: '4px 0', color: '#666' }}>
                时间：{startTime ? dayjs(startTime).format('HH:mm') : '08:00'} - {endTime ? dayjs(endTime).format('HH:mm') : '18:00'}
              </p>
            </Card>
            <Space style={{ width: '100%' }}>
              <Button onClick={() => setCurrent(1)}>上一步</Button>
              <Button type="primary" loading={submitting} onClick={handleReserve} style={{ flex: 1 }}>
                确认预约
              </Button>
            </Space>
          </div>
        )}

        {current === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
            <h3>预约成功！</h3>
            <p style={{ color: '#666' }}>您已成功预约车位 {selectedSpot?.spotNumber || selectedSpot?.id}</p>
            <Button type="primary" onClick={() => { setCurrent(0); setSelectedSpot(null); }}>
              继续预约
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
