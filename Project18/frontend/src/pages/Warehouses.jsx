import React, { useState, useEffect } from 'react'
import { warehouseAPI } from '../api'
import Modal from '../components/Modal.jsx'

export default function Warehouses() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await warehouseAPI.getAll()
      if (res.code === 0) {
        setList(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const openModal = (item = null) => {
    if (item) {
      setEditing(item)
      setForm({ ...item })
    } else {
      setEditing(null)
      setForm({ name: '', address: '', latitude: '', longitude: '' })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address || form.latitude === '' || form.longitude === '') {
      alert('请填写完整信息')
      return
    }

    const data = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude)
    }

    if (editing) {
      await warehouseAPI.update(editing.id, data)
    } else {
      await warehouseAPI.create(data)
    }
    setModalVisible(false)
    loadData()
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除此仓库？')) {
      await warehouseAPI.delete(id)
      loadData()
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仓库管理</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ 新增仓库</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>仓库名称</th>
              <th>地址</th>
              <th>纬度</th>
              <th>经度</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="7" className="empty">暂无数据</td></tr>
            ) : (
              list.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.address}</td>
                  <td>{item.latitude.toFixed(6)}</td>
                  <td>{item.longitude.toFixed(6)}</td>
                  <td>{new Date(item.created_at).toLocaleString('zh-CN')}</td>
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
        title={editing ? '编辑仓库' : '新增仓库'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <div className="form-group">
          <label className="form-label">仓库名称</label>
          <input
            type="text"
            className="form-input"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="请输入仓库名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">地址</label>
          <input
            type="text"
            className="form-input"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="请输入地址"
          />
        </div>
        <div className="form-group">
          <label className="form-label">纬度</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={form.latitude}
            onChange={e => setForm({ ...form, latitude: e.target.value })}
            placeholder="例如：39.9042"
          />
        </div>
        <div className="form-group">
          <label className="form-label">经度</label>
          <input
            type="number"
            step="any"
            className="form-input"
            value={form.longitude}
            onChange={e => setForm({ ...form, longitude: e.target.value })}
            placeholder="例如：116.4074"
          />
        </div>
      </Modal>
    </div>
  )
}
