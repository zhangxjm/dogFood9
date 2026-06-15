import React from 'react'

export function StatusTag({ status }) {
  const statusMap = {
    '空闲': 'tag-success',
    '工作中': 'tag-info',
    '配送中': 'tag-warning',
    '待配送': 'tag-default',
    '已送达': 'tag-success',
    '待执行': 'tag-default',
    '执行中': 'tag-warning',
    '已完成': 'tag-success'
  }

  const tagClass = statusMap[status] || 'tag-default'

  return (
    <span className={`tag ${tagClass}`}>{status}</span>
  )
}

export function PriorityTag({ priority }) {
  const priorityMap = {
    1: { text: '低', class: 'tag-default' },
    2: { text: '中', class: 'tag-warning' },
    3: { text: '高', class: 'tag-danger' }
  }

  const p = priorityMap[priority] || priorityMap[1]

  return (
    <span className={`tag ${p.class}`}>{p.text}</span>
  )
}
