import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Tag, Button, Space, message, Descriptions, Badge } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getDevices, sendDeviceCommand, reconnectDevice } from '../../api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const STATUS_CONFIG = {
  ONLINE: { color: '#52c41a', text: '在线' },
  OFFLINE: { color: '#ff4d4f', text: '离线' },
  ERROR: { color: '#faad14', text: '故障' },
};

const DEVICE_TYPE_COMMANDS = {
  GATE: [
    { command: 'OPEN', label: '开闸' },
    { command: 'CLOSE', label: '关闸' },
  ],
  CAMERA: [
    { command: 'RECOGNIZE', label: '识别' },
  ],
  SENSOR: [],
  DISPLAY: [
    { command: 'REFRESH', label: '刷新显示' },
  ],
};

export default function HardwareMonitor() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : data?.data || data?.devices || []);
    } catch (e) {
      message.error('加载设备数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleCommand = async (deviceId, command) => {
    try {
      await sendDeviceCommand(deviceId, { command });
      message.success('指令发送成功');
      fetchDevices();
    } catch (e) {
      message.error('指令发送失败');
    }
  };

  const handleReconnect = async (deviceId) => {
    try {
      await reconnectDevice(deviceId);
      message.success('重连指令已发送');
      fetchDevices();
    } catch (e) {
      message.error('重连失败');
    }
  };

  const typeLabel = { GATE: '道闸', CAMERA: '摄像头', SENSOR: '传感器', DISPLAY: '显示屏' };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>设备监控</h3>
        <Button icon={<ReloadOutlined />} onClick={fetchDevices}>刷新</Button>
      </div>
      <Row gutter={[16, 16]}>
        {devices.map((device) => {
          const cfg = STATUS_CONFIG[device.status] || STATUS_CONFIG.OFFLINE;
          const commands = DEVICE_TYPE_COMMANDS[device.type] || [];
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={device.id}>
              <Card
                size="small"
                title={
                  <Space>
                    <Badge color={cfg.color} />
                    <span>{device.location || device.id}</span>
                  </Space>
                }
                extra={<Tag color={cfg.color}>{cfg.text}</Tag>}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="设备类型">{typeLabel[device.type] || device.type}</Descriptions.Item>
                  <Descriptions.Item label="IP地址">{device.ipAddress || '-'}</Descriptions.Item>
                  <Descriptions.Item label="最后心跳">
                    {device.lastHeartbeat ? dayjs(device.lastHeartbeat).fromNow() : '-'}
                  </Descriptions.Item>
                  {device.location && <Descriptions.Item label="位置">{device.location}</Descriptions.Item>}
                </Descriptions>
                <Space style={{ marginTop: 8 }} wrap>
                  {commands.map((cmd) => (
                    <Button key={cmd.command} size="small" onClick={() => handleCommand(device.id, cmd.command)}>
                      {cmd.label}
                    </Button>
                  ))}
                  {device.status !== 'ONLINE' && (
                    <Button size="small" type="primary" danger onClick={() => handleReconnect(device.id)}>
                      重连
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      {devices.length === 0 && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无设备数据</div>
        </Card>
      )}
    </div>
  );
}
