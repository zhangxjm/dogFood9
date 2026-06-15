import React, { useState, useEffect } from 'react'
import { statsAPI } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await statsAPI.getStats()
      if (res.code === 0) {
        setStats(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  const statCards = [
    { title: '仓库数量', value: stats?.total_warehouses || 0, color: '' },
    { title: '司机数量', value: stats?.total_drivers || 0, color: '' },
    { title: '空闲司机', value: stats?.idle_drivers || 0, color: 'green' },
    { title: '车辆数量', value: stats?.total_vehicles || 0, color: '' },
    { title: '空闲车辆', value: stats?.idle_vehicles || 0, color: 'green' },
    { title: '配送中车辆', value: stats?.delivering_vehicles || 0, color: 'orange' },
    { title: '订单总数', value: stats?.total_orders || 0, color: '' },
    { title: '待配送订单', value: stats?.pending_orders || 0, color: 'orange' },
    { title: '配送中订单', value: stats?.delivering_orders || 0, color: 'orange' },
    { title: '已送达订单', value: stats?.delivered_orders || 0, color: 'green' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">统计概览</h1>
        <button className="btn btn-primary" onClick={loadStats}>刷新数据</button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-title">{card.title}</div>
            <div className={`stat-value ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>系统说明</h3>
        <ul style={{ lineHeight: 2, paddingLeft: 20, color: '#666' }}>
          <li>本系统基于遗传算法实现多仓库、多车辆的配送路径智能优化</li>
          <li>支持订单录入、车辆管理、司机管理等基础数据维护</li>
          <li>集成地图可视化展示，实时跟踪配送进度</li>
          <li>可处理大规模订单的路径计算和动态调度</li>
        </ul>
      </div>
    </div>
  )
}
