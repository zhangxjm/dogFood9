import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Button, Space, Spin, message } from 'antd';
import { EnterOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { examApi } from '../../api';

const { Title } = Typography;

interface ExamRecord {
  id: number;
  title: string;
  subject?: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: number;
  paperId?: number;
  description?: string;
}

interface ExamStudentRecord {
  id: number;
  examId: number;
  status: number;
}

const Exam: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadExams();
  }, [pageNum, pageSize]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const res = await examApi.list();
      const records = (res.data as any).records || [];
      const totalCount = (res.data as any).total || 0;
      setExams(records);
      setTotal(totalCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getExamStudentId = (examId: number): number | null => {
    const stored = localStorage.getItem(`exam_student_${examId}`);
    return stored ? parseInt(stored, 10) : null;
  };

  const handleEnterExam = (examId: number) => {
    navigate(`/student/exam/${examId}`);
  };

  const handleViewResult = (examId: number) => {
    const examStudentId = getExamStudentId(examId);
    if (examStudentId) {
      navigate(`/student/result/${examStudentId}`);
    } else {
      message.warning('未找到考试记录');
    }
  };

  const isExamInTimeRange = (startTime: string, endTime: string) => {
    const now = dayjs();
    return now.isAfter(dayjs(startTime)) && now.isBefore(dayjs(endTime));
  };

  const getStatusTag = (status: number, startTime: string, endTime: string) => {
    const inRange = isExamInTimeRange(startTime, endTime);
    let color: string = 'default';
    let text: string = '未开始';

    if (status === 2) {
      color = 'success';
      text = '已结束';
    } else if (status === 1 || inRange) {
      color = 'processing';
      text = '进行中';
    } else {
      color = 'default';
      text = '未开始';
    }

    return <Tag color={color}>{text}</Tag>;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const getSubject = (title: string) => {
    const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
    for (const s of subjects) {
      if (title.includes(s)) return s;
    }
    return '综合';
  };

  const columns = [
    {
      title: '考试标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: '科目',
      key: 'subject',
      width: 100,
      render: (_: any, record: ExamRecord) => {
        const subject = record.subject || getSubject(record.title);
        const colors: Record<string, string> = {
          数学: 'blue',
          语文: 'red',
          英语: 'purple',
          物理: 'cyan',
          化学: 'green',
          生物: 'lime',
          历史: 'orange',
          地理: 'geekblue',
          政治: 'magenta',
          综合: 'default',
        };
        return <Tag color={colors[subject] || 'default'}>{subject}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 170,
      render: (text: string) => (text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: ExamRecord) =>
        getStatusTag(record.status, record.startTime, record.endTime),
    },
    {
      title: '考试时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (text: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined style={{ color: '#999' }} />
          {formatDuration(text || 0)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, record: ExamRecord) => {
        const inRange = isExamInTimeRange(record.startTime, record.endTime);
        const canEnter = (record.status === 0 || record.status === 1) && inRange;
        const isEnded = record.status === 2 || dayjs().isAfter(dayjs(record.endTime));
        const examStudentId = getExamStudentId(record.id);

        return (
          <Space>
            {canEnter && (
              <Button
                type="primary"
                size="small"
                icon={<EnterOutlined />}
                onClick={() => handleEnterExam(record.id)}
              >
                进入考场
              </Button>
            )}
            {isEnded && examStudentId && (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewResult(record.id)}
              >
                查看成绩
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginTop: 0, marginBottom: 24 }}>
        我的考试
      </Title>
      <div style={{ background: '#fff', borderRadius: 12, padding: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={exams}
          loading={loading}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPageNum(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </div>
    </div>
  );
};

export default Exam;
