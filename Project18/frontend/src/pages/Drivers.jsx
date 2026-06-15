import React, { useState, useEffect } from 'react'
import { driverAPI } from '../api'
import Modal from '../components/Modal.jsx'
import { StatusTag } from '../components/Tags.jsx'

export default function Drivers() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    status: '空闲'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await driverAPI.getAll()
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
      setForm({ name: '', phone: '', status: '空闲' })
    }
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!form.name) {
      alert('请填写司机姓名')
      return
    }

    if (editing) {
      await driverAPI.update(editing.id, form)
    } else {
      await driverAPI.create(form)
    }
    setModalVisible(false)
    loadData()
  }

  const handleDelete = async (id) => {
    if (confirm('确定删除此司机？')) {
      await driverAPI.delete(id)
      loadData()
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">司机管理</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ 新增司机</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>联系电话</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="loading">加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="6" className="empty">暂无数据</td></tr>
            ) : (
              list.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.phone || '-'}</td>
                  <td><StatusTag status={item.status} /></td>
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
        title={editing ? '编辑司机' : '新增司机'}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOk={handleSubmit}
      >
        <div className="form-group">
          <label className="form-label">姓名</label>
          <input
            type="text"
            className="form-input"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="请输入司机姓名"
          />
        </div>
        <div className="form-group">
          <label className="form-label">联系电话</label>
          <input
            type="text"
            className="form-input"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="请输入联系电话"
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
            <option value="工作中">工作中</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}
