import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Select, Modal, Tag, Spin, message, Row, Col } from 'antd';
import { getSpots, createParkingWebSocket } from '../../api';

const STATUS_CONFIG = {
  FREE: { color: '#52c41a', label: '空闲' },
  OCCUPIED: { color: '#ff4d4f', label: '已占用' },
  RESERVED: { color: '#faad14', label: '预约' },
  MAINTENANCE: { color: '#d9d9d9', label: '维护' },
};

export default function ParkingMap() {
  const [loading, setLoading] = useState(true);
  const [spots, setSpots] = useState([]);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const wsRef = useRef(null);

  const fetchSpots = useCallback(async () => {
    try {
      const data = await getSpots();
      const list = Array.isArray(data) ? data : data?.spots || data?.data || [];
      setSpots(list);
      const floorSet = [...new Set(list.map((s) => s.floor).filter(Boolean))];
      setFloors(floorSet);
      if (!selectedFloor && floorSet.length > 0) {
        setSelectedFloor(floorSet[0]);
      }
    } catch (e) {
      message.error('加载车位数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedFloor]);

  useEffect(() => {
    fetchSpots();
    const interval = setInterval(fetchSpots, 15000);

    wsRef.current = createParkingWebSocket((msg) => {
      if (msg.type === 'SPOT_UPDATE') fetchSpots();
    });

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchSpots]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const filteredSpots = spots.filter((s) => !selectedFloor || s.floor === selectedFloor);

  const zones = {};
  filteredSpots.forEach((spot) => {
    const zone = spot.zone || 'A';
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push(spot);
  });

  return (
    <div>
      <Card
        title="车位地图"
        extra={
          <Select
            style={{ width: 150 }}
            placeholder="选择楼层"
            value={selectedFloor}
            onChange={setSelectedFloor}
            options={floors.map((f) => ({ label: `${f}层`, value: f }))}
          />
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 16, background: cfg.color, borderRadius: 2 }} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>

        {Object.entries(zones).map(([zone, zoneSpots]) => (
          <div key={zone} style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12 }}>{zone}区</h4>
            <Row gutter={[8, 8]}>
              {zoneSpots.map((spot) => {
                const cfg = STATUS_CONFIG[spot.status] || STATUS_CONFIG.FREE;
                return (
                  <Col key={spot.id || spot.spotId}>
                    <div
                      onClick={() => setSelectedSpot(spot)}
                      style={{
                        width: 48,
                        height: 48,
                        background: cfg.color,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: spot.status === 'MAINTENANCE' ? '#999' : '#fff',
                        fontSize: 11,
                        fontWeight: 'bold',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {spot.spotNumber || spot.id}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        ))}
      </Card>

      <Modal
        title="车位详情"
        open={!!selectedSpot}
        onCancel={() => setSelectedSpot(null)}
        footer={null}
      >
        {selectedSpot && (
          <div>
            <p><strong>车位编号：</strong>{selectedSpot.spotNumber || selectedSpot.id}</p>
            <p><strong>楼层：</strong>{selectedSpot.floor}层</p>
            <p><strong>区域：</strong>{selectedSpot.zone}区</p>
            <p>
              <strong>状态：</strong>
              <Tag color={STATUS_CONFIG[selectedSpot.status]?.color}>
                {STATUS_CONFIG[selectedSpot.status]?.label || selectedSpot.status}
              </Tag>
            </p>
            {selectedSpot.plateNumber && (
              <p><strong>车牌号：</strong>{selectedSpot.plateNumber}</p>
            )}
            {selectedSpot.entryTime && (
              <p><strong>入场时间：</strong>{selectedSpot.entryTime}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
