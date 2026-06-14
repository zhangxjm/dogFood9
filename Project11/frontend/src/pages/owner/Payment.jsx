import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Descriptions, Input, Modal, Result, Tag, Spin, message, Space } from 'antd';
import { WechatOutlined, AlipayCircleOutlined, PayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getBilling, payBill } from '../../api';
import dayjs from 'dayjs';

export default function Payment() {
  const [plateNumber, setPlateNumber] = useState('');
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payMethod, setPayMethod] = useState(null);

  const handleQuery = useCallback(async () => {
    if (!plateNumber.trim()) {
      message.warning('请输入车牌号');
      return;
    }
    setLoading(true);
    try {
      const data = await getBilling(plateNumber.trim());
      setBilling(data || null);
    } catch (e) {
      message.error('查询计费信息失败');
    } finally {
      setLoading(false);
    }
  }, [plateNumber]);

  const handlePay = async (method) => {
    setPayMethod(method);
    setPaying(true);
    try {
      await payBill({ plateNumber: plateNumber.trim(), amount: billing?.amount, payMethod: method });
      setPaySuccess(true);
    } catch (e) {
      message.error('支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  if (paySuccess) {
    return (
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <Card style={{ borderRadius: 12, textAlign: 'center' }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined />}
            title="支付成功"
            subTitle={`车牌号 ${plateNumber}，支付金额 ¥${billing?.amount?.toFixed(2) || '0.00'}`}
            extra={[
              <Button key="back" type="primary" onClick={() => { setPaySuccess(false); setBilling(null); setPlateNumber(''); }}>
                返回
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
          <PayCircleOutlined style={{ marginRight: 8 }} />
          无感支付
        </h3>

        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
          <Input
            placeholder="请输入车牌号"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            onPressEnter={handleQuery}
            style={{ flex: 1 }}
          />
          <Button type="primary" onClick={handleQuery} loading={loading}>
            查询
          </Button>
        </Space.Compact>

        {billing && (
          <div>
            <Card size="small" style={{ background: '#f6ffed', marginBottom: 16, borderRadius: 8 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="车牌号">
                  <Tag color="blue">{plateNumber}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="入场时间">
                  {billing.entryTime ? dayjs(billing.entryTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="停车时长">
                  {billing.duration ? `${billing.duration}小时` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="应付金额">
                  <span style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                    ¥{billing.amount?.toFixed(2) || '0.00'}
                  </span>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <div>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>选择支付方式</p>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Button
                  block
                  size="large"
                  icon={<WechatOutlined style={{ color: '#07c160' }} />}
                  onClick={() => handlePay('WECHAT')}
                  loading={paying && payMethod === 'WECHAT'}
                  style={{ height: 48, borderColor: '#07c160' }}
                >
                  微信支付
                </Button>
                <Button
                  block
                  size="large"
                  icon={<AlipayCircleOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => handlePay('ALIPAY')}
                  loading={paying && payMethod === 'ALIPAY'}
                  style={{ height: 48, borderColor: '#1677ff' }}
                >
                  支付宝支付
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
