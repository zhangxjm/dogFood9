import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Transfer,
  message,
  Popconfirm,
  Typography,
  Spin,
  Row,
  Col,
  Descriptions,
  Progress,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  examApi,
  paperApi,
  userApi,
} from '../../api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ExamManage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [papers, setPapers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [examStudents, setExamStudents] = useState<any[]>([]);
  const [targetKeys, setTargetKeys] = useState<number[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchList();
  }, [pageNum, pageSize]);

  const fetchMeta = async () => {
    try {
      const [papersRes, studentsRes] = await Promise.all([
        paperApi.list({ status: 1 }),
        userApi.students(),
      ]);
      const paperList = papersRes?.data?.list || papersRes?.data || [];
      setPapers(Array.isArray(paperList) ? paperList : []);
      const studentList = studentsRes?.data?.list || studentsRes?.data || [];
      setStudents(Array.isArray(studentList) ? studentList : []);
    } catch (error) {
      console.error('获取元数据失败:', error);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await examApi.list();
      const list = res?.data?.list || res?.data || [];
      setData(Array.isArray(list) ? list : []);
      setTotal(res?.data?.total || list.length || 0);
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (record: any) => {
    const now = Date.now();
    const start = new Date(record.startTime || record.start_time).getTime();
    const end = new Date(record.endTime || record.end_time).getTime();
    if (now < start) return { color: 'default', text: '未开始' };
    if (now > end) return { color: 'default', text: '已结束' };
    return { color: 'processing', text: '进行中' };
  };

  const handleDetail = async (record: any) => {
    try {
      const detailRes = await examApi.detail(record.id);
      const studentsRes = await examApi.students(record.id);
      setDetailData(detailRes?.data || record);
      setExamStudents(studentsRes?.data?.list || studentsRes?.data || []);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('获取考试详情失败:', error);
    }
  };

  const handleScoreList = async (record: any) => {
    try {
      const detailRes = await examApi.detail(record.id);
      const studentsRes = await examApi.students(record.id);
      setDetailData(detailRes?.data || record);
      setExamStudents(studentsRes?.data?.list || studentsRes?.data || []);
      setScoreModalOpen(true);
    } catch (error) {
      console.error('获取成绩列表失败:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      message.success('删除成功');
      fetchList();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setTargetKeys([]);
    setCreateModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (targetKeys.length === 0) {
        message.warning('请至少选择一名学生');
        return;
      }
      setModalLoading(true);

      const [startTime, endTime] = values.timeRange || [];
      const payload = {
        title: values.title,
        description: values.description,
        paperId: values.paperId,
        startTime: startTime?.toISOString(),
        endTime: endTime?.toISOString(),
        studentIds: targetKeys,
      };

      await examApi.create(payload);
      message.success('创建考试成功');
      setCreateModalOpen(false);
      fetchList();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error('提交失败:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    {
      title: '考试标题',
      dataIndex: 'title',
      render: (t: string, r: any) => (
        <a onClick={() => handleDetail(r)} style={{ color: '#1677ff' }}>
          {t || r.name || '-'}
        </a>
      ),
    },
    {
      title: '关联试卷',
      dataIndex: 'paperTitle',
      width: 160,
      render: (t: string, r: any) => t || r.paper_title || r.paperName || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 170,
      render: (t: string, r: any) => t || r.start_time || '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 170,
      render: (t: string, r: any) => t || r.end_time || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (_: any, record: any) => {
        const status = getExamStatus(record);
        return <Tag color={status.color as any}>{status.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      render: (t: string, r: any) => t || r.created_at || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => handleScoreList(record)}
          >
            查看成绩
          </Button>
          <Popconfirm title="确定删除该考试吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const studentTransferData = students.map((s) => ({
    key: s.id,
    title: `${s.realName || s.username} (${s.username})`,
    description: s.email || s.phone || '',
  }));

  const renderScoreStats = () => {
    if (examStudents.length === 0) return null;
    const total = examStudents.length;
    const submitted = examStudents.filter((s) => s.submitted || s.status === 2 || s.score !== null && s.score !== undefined).length;
    const scores = examStudents
      .map((s) => Number(s.score))
      .filter((n) => !isNaN(n));
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
    const max = scores.length ? Math.max(...scores).toFixed(1) : '-';
    const min = scores.length ? Math.min(...scores).toFixed(1) : '-';
    const passCount = scores.filter((s) => s >= 60).length;
    const passRate = scores.length ? ((passCount / scores.length) * 100).toFixed(1) : '-';

    return (
      <div style={{ marginBottom: 16 }}>
        <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
          成绩概览
        </Divider>
        <Row gutter={16}>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="参考人数">{total}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="已提交">{submitted}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="平均分">{avg}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="及格率">{passRate}%</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 12 }}>
          <Col span={12}>
            <div style={{ marginBottom: 4 }}>提交进度</div>
            <Progress percent={total ? Math.round((submitted / total) * 100) : 0} />
          </Col>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="最高分">{max}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={6}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="最低分">{min}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </div>
    );
  };

  const scoreColumns = [
    {
      title: '学生姓名',
      dataIndex: 'realName',
      width: 120,
      render: (n: string, r: any) => n || r.name || r.studentName || r.student_name || '-',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      render: (n: string, r: any) => n || r.studentUsername || r.student_username || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_: any, r: any) => {
        const submitted = r.submitted || r.status === 2;
        return (
          <Tag color={submitted ? 'green' : 'default'}>
            {submitted ? '已提交' : '未提交'}
          </Tag>
        );
      },
    },
    {
      title: '分数',
      dataIndex: 'score',
      width: 100,
      render: (s: number | string) => {
        if (s === null || s === undefined || s === '') return '-';
        const num = Number(s);
        return (
          <span style={{ fontWeight: 600, color: num >= 60 ? '#52c41a' : '#f5222d' }}>
            {num.toFixed(1)}
          </span>
        );
      },
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      render: (t: string, r: any) => t || r.submit_time || r.submittedAt || '-',
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24, marginTop: 0 }}>
        考试管理
      </Title>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建考试
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPageNum(p);
              setPageSize(ps);
            },
          }}
        />
      </Spin>

      <Modal
        title="新建考试"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={modalLoading}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="考试标题"
            name="title"
            rules={[{ required: true, message: '请输入考试标题' }]}
          >
            <Input placeholder="请输入考试标题" />
          </Form.Item>
          <Form.Item label="考试描述" name="description">
            <TextArea rows={2} placeholder="请输入考试描述（可选）" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="选择试卷"
                name="paperId"
                rules={[{ required: true, message: '请选择试卷' }]}
              >
                <Select
                  placeholder="请选择已发布的试卷"
                  showSearch
                  optionFilterProp="children"
                >
                  {papers.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.title || p.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="考试时间"
                name="timeRange"
                rules={[{ required: true, message: '请选择考试时间' }]}
              >
                <RangePicker
                  showTime={{ format: 'HH:mm' }}
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder={['开始时间', '结束时间']}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="选择学生"
            name="studentIds"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Transfer
              dataSource={studentTransferData}
              titles={['可选学生', '已选学生']}
              targetKeys={targetKeys as any}
              onChange={(keys) => setTargetKeys(keys as number[])}
              render={(item) => item.title}
              listStyle={{ width: '100%', height: 280 }}
              showSearch
              filterOption={(inputValue, item: any) =>
                item.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
                item.description?.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="考试详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          <Button
            key="score"
            type="primary"
            icon={<TeamOutlined />}
            onClick={() => {
              setDetailModalOpen(false);
              setScoreModalOpen(true);
            }}
          >
            查看成绩列表
          </Button>,
        ]}
        width={720}
      >
        {detailData && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="考试标题" span={2}>
                {detailData.title || detailData.name}
              </Descriptions.Item>
              <Descriptions.Item label="关联试卷">
                {detailData.paperTitle || detailData.paper_title || detailData.paperName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = getExamStatus(detailData);
                  return <Tag color={s.color as any}>{s.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {detailData.startTime || detailData.start_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {detailData.endTime || detailData.end_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="参考人数">
                {examStudents.length}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {detailData.createTime || detailData.created_at || '-'}
              </Descriptions.Item>
              {detailData.description && (
                <Descriptions.Item label="描述" span={2}>
                  {detailData.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {renderScoreStats()}
          </div>
        )}
      </Modal>

      <Modal
        title={detailData ? `${detailData.title || detailData.name || '考试'} - 成绩列表` : '成绩列表'}
        open={scoreModalOpen}
        onCancel={() => setScoreModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setScoreModalOpen(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {renderScoreStats()}
        <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
          学生成绩
        </Divider>
        <Table
          columns={scoreColumns}
          dataSource={examStudents}
          rowKey={(r) => r.id || r.studentId || r.student_id}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default ExamManage;
