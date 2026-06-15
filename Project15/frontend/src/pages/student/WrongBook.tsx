import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Select,
  Tag,
  Button,
  Spin,
  message,
  Space,
  Empty,
  Pagination,
  Collapse,
} from 'antd';
import {
  BookOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { wrongBookApi, userApi } from '../../api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const QUESTION_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '单选题', color: 'blue' },
  2: { label: '多选题', color: 'purple' },
  3: { label: '判断题', color: 'cyan' },
  4: { label: '填空题', color: 'orange' },
  5: { label: '主观题', color: 'magenta' },
};

const DIFFICULTY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '简单', color: 'green' },
  2: { label: '中等', color: 'gold' },
  3: { label: '困难', color: 'red' },
};

interface WrongBookItem {
  id: number;
  questionId: number;
  question?: {
    id: number;
    type: number;
    content: string;
    analysis?: string;
    difficulty?: number;
    score?: number;
    subject?: string;
  };
  subject?: string;
  wrongCount: number;
  userAnswer?: string;
  correctAnswer?: string;
  masterStatus: number;
  createTime?: string;
}

const WrongBook: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [countLoading, setCountLoading] = useState(true);
  const [data, setData] = useState<WrongBookItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [subject, setSubject] = useState<string | undefined>();
  const [masterStatus, setMasterStatus] = useState<number | undefined>();
  const [subjects, setSubjects] = useState<string[]>(['数学', '语文', '英语', '物理', '化学']);

  const [countData, setCountData] = useState<{
    total: number;
    unmastered: number;
    mastered: number;
  }>({ total: 0, unmastered: 0, mastered: 0 });

  const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [pageNum, pageSize, subject, masterStatus]);

  useEffect(() => {
    loadCount();
  }, [subject]);

  const loadSubjects = async () => {
    try {
      const res = await userApi.subjects();
      if (res.data && res.data.length > 0) {
        setSubjects(res.data as string[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await wrongBookApi.list({
        subject,
        masterStatus,
        pageNum,
        pageSize,
      });
      const records = (res.data as any).records || [];
      const totalCount = (res.data as any).total || 0;
      setData(records);
      setTotal(totalCount);
    } catch (e) {
      console.error(e);
      message.error('加载错题本失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async () => {
    setCountLoading(true);
    try {
      const res = await wrongBookApi.count();
      const d = res.data as any;
      setCountData({
        total: d?.total || 0,
        unmastered: d?.unmastered || 0,
        mastered: d?.mastered || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCountLoading(false);
    }
  };

  const handleMarkMastered = async (id: number) => {
    try {
      await wrongBookApi.markMastered(id);
      message.success('已标记为已掌握');
      loadData();
      loadCount();
    } catch (e) {
      console.error(e);
      message.error('操作失败');
    }
  };

  const handleFilterChange = () => {
    setPageNum(1);
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        错题本
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, borderTop: '3px solid #ff4d4f' }} loading={countLoading}>
            <Statistic
              title="总错题数"
              value={countData.total}
              prefix={<BookOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, borderTop: '3px solid #faad14' }} loading={countLoading}>
            <Statistic
              title="未掌握"
              value={countData.unmastered}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12, borderTop: '3px solid #52c41a' }} loading={countLoading}>
            <Statistic
              title="已掌握"
              value={countData.mastered}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, marginBottom: 16 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space size="large" wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text>科目：</Text>
            <Select
              style={{ width: 150 }}
              value={subject}
              onChange={(v) => { setSubject(v); handleFilterChange(); }}
              allowClear
              placeholder="全部科目"
            >
              {subjects.map((s) => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text>掌握状态：</Text>
            <Select
              style={{ width: 150 }}
              value={masterStatus}
              onChange={(v) => { setMasterStatus(v); handleFilterChange(); }}
              allowClear
              placeholder="全部状态"
            >
              <Option value={0}>未掌握</Option>
              <Option value={1}>已掌握</Option>
            </Select>
          </div>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty
            description={
              <span>
                <CloseCircleOutlined style={{ color: '#999', marginRight: 6 }} />
                暂无错题记录
              </span>
            }
            style={{ padding: '60px 0' }}
          />
        </Card>
      ) : (
        <>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {data.map((item) => {
              const q = item.question;
              const typeInfo = q ? (QUESTION_TYPE_MAP[q.type] || { label: '未知', color: 'default' }) : { label: '未知', color: 'default' };
              const diffInfo = q?.difficulty ? (DIFFICULTY_MAP[q.difficulty] || { label: '-', color: 'default' }) : { label: '-', color: 'default' };
              const isMastered = item.masterStatus === 1;

              return (
                <Card key={item.id} style={{ borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                    <Space wrap size="small">
                      <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                      {q?.subject && <Tag color="geekblue">{q.subject}</Tag>}
                      <Tag color={diffInfo.color}>难度：{diffInfo.label}</Tag>
                      <Tag color={isMastered ? 'success' : 'warning'}>
                        {isMastered ? '已掌握' : '未掌握'}
                      </Tag>
                      <Tag icon={<CloseCircleOutlined />} color="error">
                        错误 {item.wrongCount} 次
                      </Tag>
                    </Space>
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      padding: '16px 20px',
                      background: '#fafafa',
                      borderRadius: 8,
                      borderLeft: '3px solid #ff4d4f',
                      marginBottom: 12,
                    }}
                    dangerouslySetInnerHTML={{ __html: q?.content || '题目内容加载失败' }}
                  />

                  <Row gutter={[16, 12]} style={{ marginBottom: 12 }}>
                    <Col xs={24} md={12}>
                      <div style={{ padding: 12, borderRadius: 8, background: '#fff1f0' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>你的答案</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong style={{ color: '#cf1322', wordBreak: 'break-all' }}>
                            {item.userAnswer || '（未作答）'}
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ padding: 12, borderRadius: 8, background: '#f6ffed' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>正确答案</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text strong style={{ color: '#389e0d', wordBreak: 'break-all' }}>
                            {item.correctAnswer || '-'}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <Collapse
                      style={{ flex: 1, minWidth: 200, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}
                      ghost
                      activeKey={expandedKeys}
                      onChange={(keys) => setExpandedKeys(keys)}
                    >
                      <Panel
                        header={
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BulbOutlined style={{ color: '#faad14' }} />
                            <Text strong style={{ color: '#d48806' }}>查看解析</Text>
                          </span>
                        }
                        key={String(item.id)}
                      >
                        <Paragraph
                          style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#614700', lineHeight: 1.8 }}
                          dangerouslySetInnerHTML={{ __html: q?.analysis || '暂无解析' }}
                        />
                      </Panel>
                    </Collapse>

                    <Space>
                      {!isMastered && (
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkMastered(item.id)}
                        >
                          标记已掌握
                        </Button>
                      )}
                    </Space>
                  </div>
                </Card>
              );
            })}
          </Space>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={pageNum}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 条错题`}
              onChange={(p, ps) => {
                setPageNum(p);
                setPageSize(ps);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default WrongBook;
