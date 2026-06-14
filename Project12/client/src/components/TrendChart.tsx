import React from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

interface TrendChartProps {
  data: any[];
  title?: string;
  metrics?: string[];
  height?: number;
}

const metricNames: Record<string, string> = {
  avg_viewer_count: '平均观看人数',
  max_viewer_count: '峰值观看人数',
  total_likes: '点赞数',
  total_comments: '评论数',
  total_gift_value: '礼物价值',
  total_product_clicks: '商品点击',
  total_orders: '订单数',
  total_order_amount: 'GMV',
  avg_conversion_rate: '转化率',
};

const metricColors: Record<string, string> = {
  avg_viewer_count: '#1890ff',
  max_viewer_count: '#13c2c2',
  total_likes: '#52c41a',
  total_comments: '#faad14',
  total_gift_value: '#eb2f96',
  total_product_clicks: '#722ed1',
  total_orders: '#fa8c16',
  total_order_amount: '#f5222d',
  avg_conversion_rate: '#2f54eb',
};

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  metrics = ['avg_viewer_count', 'total_likes', 'total_product_clicks'],
  height = 350,
}) => {
  const option = {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: { fontSize: 16, fontWeight: 500 },
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#333' },
    },
    legend: {
      data: metrics.map((m) => metricNames[m] || m),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: title ? '15%' : '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) =>
        dayjs(item.time_bucket || item.timestamp).format('HH:mm')
      ),
      axisLabel: { fontSize: 11 },
    },
    yAxis: metrics.map((m, index) => ({
      type: 'value',
      position: index === 0 ? 'left' : 'right',
      offset: index > 1 ? (index - 1) * 60 : 0,
      axisLabel: { fontSize: 11 },
      splitLine: {
        lineStyle: { type: 'dashed', color: '#f0f0f0' },
      },
    })),
    series: metrics.map((metric, index) => ({
      name: metricNames[metric] || metric,
      type: 'line',
      smooth: true,
      symbol: 'none',
      sampling: 'lttb',
      yAxisIndex: index,
      itemStyle: { color: metricColors[metric] || '#999' },
      areaStyle:
        index === 0
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${metricColors[metric]}40` },
                  { offset: 1, color: `${metricColors[metric]}05` },
                ],
              },
            }
          : undefined,
      data: data.map((item) => item[metric] || 0),
    })),
  };

  return <ReactECharts option={option} style={{ height, width: '100%' }} />;
};

export default TrendChart;
