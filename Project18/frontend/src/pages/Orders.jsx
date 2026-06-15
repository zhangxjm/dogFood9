import React, { useState, useEffect } from 'react'
import { orderAPI, warehouseAPI } from '../api'
import Modal from '../components/Modal.jsx'
import { StatusTag, PriorityTag } from '../components/Tags.jsx'

export default function Orders() {
  const [list, setList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    order_no: '',
    customer_name: '',
    address: '',
    latitude: '',
    longitude: '',
    weight: 0,
    priority: 1,
    warehouse_id: ''
  })

  useEffect(() => {
    loadWarehouses()
  }, [])

  useEffect(() => {
    loadData()
  }, [filterStatus, filterWarehouse])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterWarehouse) params.warehouse_id = filterWarehouse
      const res = await orderAPI.getAll(params)
      if (res.code === 0) {
        setList(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadWarehouses = async () => {
    const res = await warehouseAPI.getAll()
    if (res.code === 0) setWarehouses(res.data)
  }

  const openModal = (item = null) => {
    if (item) {
      setEditing(item)
      setForm({ ...item })
    } else {
      setEditing(null)
      setForm({
        order_no: `ORD${Date.now()}`,
        customer_name: '',
        address: '',
        latitude: '',
        longitude: '',
        weight: 0,
        priority: 1,
        warehouse_id: warehouses[0]?.id || ''
      })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!form.customer_name || !form.address || form.latitude === '' || form.longitude === '' || !form.warehouse_id) {
      alert('请填写完整信息（客户名、地址、经纬度、仓库）')
      return
    }

    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      weight: parseFloat(form.weight),
      priority: parseInt(form.priority),
      warehouse_id: parseInt(form.warehouse_id)
    }

    if (editing) {
      await orderAPI.update(editing.id, data)
    } else {
      await orderAPI.create(data)
    }
    setModalVisible(false)
    loadData()
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除此订单？')) {
      await orderAPI.delete(id)
      loadData()
    }
  }

  const handleUpdateStatus = async (id, status) => {
    await orderAPI.updateStatus(id, status)
    loadData()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">订单管理</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ 新增订单</button>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="待配送">待配送</option>
            <option value="配送中">配送中</option>
            <option value="已送达">已送达</option>
          </select>
          <select
            className="form-select"
            value={filterWarehouse}
            onChange={e => setFilterWarehouse(e.target.value)}
          >
            <option value="">全部仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户名称</th>
              <th>配送地址</th>
              <th>重量(kg)</th>
              <th>优先级</th>
              <th>状态</th>
              <th>仓库</th>
              <th>车辆</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="loading">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="10" className="empty">暂无数据</td></tr>
            ) : (
              list.map(item => (
                <tr key={item.id}>
                  <td>{item.order_no}</td>
                  <td>{item.customer_name}</td>
                  <td>{item.address}</td>
                  <td>{item.weight}</td>
                  <td><PriorityTag priority={item.priority} /></td>
                  <td><StatusTag status={item.status} /></td>
                  <td>{item.warehouse?.name || '-'}</td>
                  <td>{item.vehicle?.plate_number || '-'}</td>
                  <td>{new Date(item.created_at).toLocaleString('zh-CN')}</td>
                  <td>
                    <div className="actions">
                      {item.status === '待配送' && (
                        <button className="btn btn-warning btn-sm" onClick={() => handleUpdateStatus(item.id, '配送中')}>开始配送</button>
                      )}
                      {item.status === '配送中' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus(item.id, '已送达')}>确认送达</button>
                      )}
                      <button className="btn btn-primary btn-sm" onClick={() => openModal(item)}>编辑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? '编辑订单' : '新增订单'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <div className="form-group">
          <label className="form-label">订单号</label>
          <input
            type="text"
            className="form-input"
            value={form.order_no}
            onChange={e => setForm({ ...form, order_no: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">客户名称</label>
          <input
            type="text"
            className="form-input"
            value={form.customer_name}
            onChange={e => setForm({ ...form, customer_name: e.target.value })}
            placeholder="请输入客户名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">配送地址</label>
          <input
            type="text"
            className="form-input"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="请输入配送地址"
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">纬度</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })}
              placeholder="如 39.9042"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">经度</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })}
              placeholder="如 116.4074"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">重量(kg)</label>
            <input
              type="number"
              className="form-input"
              value={form.weight}
              onChange={e => setForm({ ...form, weight: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">优先级</label>
            <select
              className="form-select"
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
            >
              <option value="1">低</option>
              <option value="2">中</option>
              <option value="3">高</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">所属仓库</label>
          <select
            className="form-select"
            value={form.warehouse_id}
            onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
          >
            <option value="">请选择仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
