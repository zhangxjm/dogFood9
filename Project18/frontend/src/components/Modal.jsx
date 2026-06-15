import React from 'react'

export default function Modal({ title, visible, onClose, onOk, children, width }) {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width || 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {onOk && (
          <div className="modal-footer">
            <button className="btn btn-default" onClick={onClose}>取消</button>
            <button className="btn btn-primary" onClick={onOk}>确定</button>
          </div>
        )}
      </div>
    </div>
  )
}
