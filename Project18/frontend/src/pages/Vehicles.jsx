import React, { useState, useEffect } from 'react'
import { vehicleAPI, warehouseAPI, driverAPI } from '../api'
import Modal from '../components/Modal.jsx'
import { StatusTag } from '../components/Tags.jsx'

export default function Vehicles() {
  const [list, setList] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterWarehouse, setFilterWarehouse] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    plate_number: '',
    type: '小型货车',
    capacity: 1000,
    status: '空闲',
    driver_id: '',
    warehouse_id: ''
  })

  useEffect(() => {
    loadData()
    loadWarehouses()
    loadDrivers()
  }, [])

  useEffect(() => {
    loadData()
  }, [filterWarehouse])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterWarehouse) params.warehouse_id = filterWarehouse
      const res = await vehicleAPI.getAll(params)
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

  const loadDrivers = async () => {
    const res = await driverAPI.getAll()
    if (res.code === 0) setDrivers(res.data)
  }

  const openModal = (item = null) => {
    if (item) {
      setEditing(item)
      setForm({
        ...item,
        driver_id: item.driver_id || ''
      })
    } else {
      setEditing(null)
      setForm({
        plate_number: '',
        type: '小型货车',
        capacity: 1000,
        status: '空闲',
        driver_id: '',
        warehouse_id: warehouses[0]?.id || ''
      })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!form.plate_number || !form.warehouse_id) {
      alert('请填写车牌号和选择所属仓库')
      return
    }

    const data = {
      ...form,
      capacity: parseFloat(form.capacity),
      driver_id: form.driver_id ? parseInt(form.driver_id) : null
    }
    delete data.driver

    if (editing) {
      await vehicleAPI.update(editing.id, data)
    } else {
      await vehicleAPI.create(data)
    }
    setModalVisible(false)
    loadData()
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除此车辆？')) {
      await vehicleAPI.delete(id)
      loadData()
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">车辆管理</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ 新增车辆</button>
      </div>

      <div className="card">
        <div className="filter-bar">
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
              <th>ID</th>
              <th>车牌号</th>
              <th>类型</th>
              <th>载重(kg)</th>
              <th>状态</th>
              <th>司机</th>
              <th>所属仓库</th>
              <th>当前位置</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="loading">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="9" className="empty">暂无数据</td></tr>
            ) : (
              list.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.plate_number}</td>
                  <td>{item.type}</td>
                  <td>{item.capacity}</td>
                  <td><StatusTag status={item.status} /></td>
                  <td>{item.driver?.name || '-'}</td>
                  <td>{item.warehouse?.name || '-'}</td>
                  <td>{item.current_lat?.toFixed(4)}, {item.current_lng?.toFixed(4)}</td>
                  <td>
                    <div className="actions">
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
        title={editing ? '编辑车辆' : '新增车辆'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <div className="form-group">
          <label className="form-label">车牌号</label>
          <input
            type="text"
            className="form-input"
            value={form.plate_number}
            onChange={e => setForm({ ...form, plate_number: e.target.value })}
            placeholder="请输入车牌号"
          />
        </div>
        <div className="form-group">
          <label className="form-label">车辆类型</label>
          <select
            className="form-select"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="小型货车">小型货车</option>
            <option value="中型货车">中型货车</option>
            <option value="大型货车">大型货车</option>
            <option value="冷藏车">冷藏车</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">载重(kg)</label>
          <input
            type="number"
            className="form-input"
            value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">状态</label>
          <select
            className="form-select"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option value="空闲">空闲</option>
            <option value="配送中">配送中</option>
            <option value="维护中">维护中</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">所属仓库</label>
          <select
            className="form-select"
            value={form.warehouse_id}
            onChange={e => setForm({ ...form, warehouse_id: parseInt(e.target.value) })}
          >
            <option value="">请选择仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">绑定司机</label>
          <select
            className="form-select"
            value={form.driver_id}
            onChange={e => setForm({ ...form, driver_id: e.target.value })}
          >
            <option value="">不绑定</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} - {d.status}</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}
