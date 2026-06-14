import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Tag, Select, Space, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAlerts, resolveAlert } from '../../api';
import dayjs from 'dayjs';

const ALERT_TYPE_CONFIG = {
  DEVICE_OFFLINE: { color: 'red', label: '设备离线' },
  OVERSTAY: { color: 'orange', label: '超时停车' },
  ILLEGAL_PARKING: { color: 'purple', label: '违停' },
  GATE_ERROR: { color: 'red', label: '道闸故障' },
  SPOT_SENSOR_ERROR: { color: 'gold', label: '传感器故障' },
};

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await getAlerts(params);
      setAlerts(Array.isArray(data) ? data : data?.data || data?.alerts || []);
    } catch (e) {
      message.error('加载告警数据失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id);
      message.success('告警已处理');
      fetchAlerts();
    } catch (e) {
      message.error('处理告警失败');
    }
  };

  const columns = [
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      render: (v) => {
        const cfg = ALERT_TYPE_CONFIG[v] || { color: 'default', label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '告警内容', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '告警时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) =>
        v === 'RESOLVED' ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>已处理</Tag>
        ) : (
          <Tag color="red">待处理</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.status !== 'RESOLVED' ? (
          <Button size="small" type="primary" onClick={() => handleResolve(record.id)}>
            处理
          </Button>
        ) : (
          <span style={{ color: '#999' }}>已处理</span>
        ),
    },
  ];

  return (
    <Card
      title="告警中心"
      extra={
        <Space>
          <Select
            style={{ width: 120 }}
            placeholder="告警类型"
            allowClear
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v || '')}
            options={Object.entries(ALERT_TYPE_CONFIG).map(([key, cfg]) => ({ label: cfg.label, value: key }))}
          />
          <Select
            style={{ width: 120 }}
            placeholder="状态"
            allowClear
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            options={[
              { label: '待处理', value: 'PENDING' },
              { label: '已处理', value: 'RESOLVED' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAlerts}>刷新</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={alerts}
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />
    </Card>
  );
}
