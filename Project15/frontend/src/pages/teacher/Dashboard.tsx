import React from 'react';
import { Row, Col, Card, Statistic, Typography } from 'antd';
import { BookOutlined, FileTextOutlined, UserOutlined, ScheduleOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const TeacherDashboard: React.FC = () => {
  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>教师工作台</Title>
      <Paragraph type="secondary">欢迎回来，管理您的考试和题库</Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="题库总数" value={0} prefix={<BookOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="试卷总数" value={0} prefix={<FileTextOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="考试总数" value={0} prefix={<ScheduleOutlined style={{ color: '#fa8c16' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="学生总数" value={0} prefix={<UserOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
