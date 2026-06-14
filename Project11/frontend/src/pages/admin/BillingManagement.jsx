import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Form, InputNumber, Input, Space, message, Descriptions, Divider, Row, Col, Statistic, Tag } from 'antd';
import { DollarOutlined, PayCircleOutlined } from '@ant-design/icons';
import { getBillingRecords, getBillingRules, updateBillingRules, getBilling, payBill } from '../../api';
import dayjs from 'dayjs';

export default function BillingManagement() {
  const [records, setRecords] = useState([]);
  const [rules, setRules] = useState({});
  const [currentBilling, setCurrentBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [payPlate, setPayPlate] = useState('');
  const [form] = Form.useForm();

  const fetchRecords = useCallback(async () => {
    try {
      const data = await getBillingRecords();
      setRecords(Array.isArray(data) ? data : data?.data || data?.records || []);
    } catch (e) {
      message.error('加载计费记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRules = useCallback(async () => {
    try {
      const data = await getBillingRules();
      setRules(data || {});
      form.setFieldsValue(data || {});
    } catch (e) {
      message.error('加载计费规则失败');
    }
  }, [form]);

  useEffect(() => {
    fetchRecords();
    fetchRules();
  }, [fetchRecords, fetchRules]);

  const handleUpdateRules = async (values) => {
    try {
      setRulesLoading(true);
      await updateBillingRules(values);
      message.success('计费规则更新成功');
      fetchRules();
    } catch (e) {
      message.error('更新计费规则失败');
    } finally {
      setRulesLoading(false);
    }
  };

  const handleQueryBilling = async () => {
    if (!payPlate) {
      message.warning('请输入车牌号');
      return;
    }
    try {
      const data = await getBilling(payPlate);
      setCurrentBilling(data || null);
    } catch (e) {
      message.error('查询当前计费失败');
    }
  };

  const handlePay = async () => {
    if (!currentBilling) return;
    try {
      await payBill({ plateNumber: payPlate, amount: currentBilling.amount });
      message.success('支付成功');
      setCurrentBilling(null);
      setPayPlate('');
      fetchRecords();
    } catch (e) {
      message.error('支付失败');
    }
  };

  const recordColumns = [
    { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
    { title: '入场时间', dataIndex: 'entryTime', key: 'entryTime', render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: '出场时间', dataIndex: 'exitTime', key: 'exitTime', render: (v) => v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: '停车时长', dataIndex: 'duration', key: 'duration', render: (v) => v ? `${v}小时` : '-' },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', render: (v) => v != null ? `¥${v.toFixed(2)}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => v === 'PAID' ? <Tag color="green">已支付</Tag> : <Tag color="orange">未支付</Tag> },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="当前计费查询" extra={<DollarOutlined />}>
            <Space style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入车牌号查询"
                value={payPlate}
                onChange={(e) => setPayPlate(e.target.value)}
                style={{ width: 200 }}
              />
              <Button type="primary" onClick={handleQueryBilling}>查询</Button>
            </Space>
            {currentBilling && (
              <div>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="车牌号">{currentBilling.plateNumber}</Descriptions.Item>
                  <Descriptions.Item label="入场时间">{currentBilling.entryTime ? dayjs(currentBilling.entryTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="停车时长">{currentBilling.duration ? `${currentBilling.duration}小时` : '-'}</Descriptions.Item>
                  <Descriptions.Item label="应付金额">
                    <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 'bold' }}>¥{currentBilling.amount?.toFixed(2) || '0.00'}</span>
                  </Descriptions.Item>
                </Descriptions>
                <Button type="primary" icon={<PayCircleOutlined />} onClick={handlePay} block style={{ marginTop: 12 }}>
                  确认收费
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="计费规则设置">
            <Form form={form} layout="vertical" onFinish={handleUpdateRules}>
              <Form.Item name="firstHourFee" label="首小时费用(元)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="additionalHourFee" label="追加每小时费用(元)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="dailyMaxFee" label="每日封顶费用(元)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="monthlyFee" label="月租费用(元/月)">
                <InputNumber min={0} step={1} style={{ width: '100%' }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={rulesLoading} block>保存规则</Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="计费记录" style={{ marginTop: 16 }}>
        <Table
          rowKey={(r) => r.id || r.plateNumber + r.entryTime}
          columns={recordColumns}
          dataSource={records}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </div>
  );
}
