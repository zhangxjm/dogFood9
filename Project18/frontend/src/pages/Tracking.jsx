import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { statsAPI } from '../api'
import { StatusTag } from '../components/Tags.jsx'

const createCustomIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;">🚚</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

const warehouseIcon = createCustomIcon('#1890ff', 30)
const orderIcon = (status) => {
  const colors = {
    '待配送': '#fa8c16',
    '配送中': '#1890ff',
    '已送达': '#52c41a'
  }
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${colors[status] || '#999'};width:18px;height:18px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })
}

function MapAutoCenter({ vehicles, orders }) {
  const map = useMap()

  useEffect(() => {
    const points = []
    vehicles.forEach(v => {
      if (v.current_lat && v.current_lng) {
        points.push([v.current_lat, v.current_lng])
      }
    })
    orders.forEach(o => {
      if (o.latitude && o.longitude) {
        points.push([o.latitude, o.longitude])
      }
    })
    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [vehicles, orders, map])

  return null
}

export default function Tracking() {
  const [data, setData] = useState({ vehicles: [], orders: [] })
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const refreshTimer = useRef(null)

  useEffect(() => {
    loadData()
    refreshTimer.current = setInterval(loadData, 10000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [])

  const loadData = async () => {
    try {
      const res = await statsAPI.getTracking()
      if (res.code === 0) {
        setData(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getMapCenter = () => {
    if (data.vehicles.length > 0 && data.vehicles[0].current_lat) {
      return [data.vehicles[0].current_lat, data.vehicles[0].current_lng]
    }
    return [39.9042, 116.4074]
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">实时跟踪</h1>
        <button className="btn btn-primary" onClick={loadData}>刷新</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div className="card">
          <div className="map-container">
            <MapContainer
              center={getMapCenter()}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapAutoCenter vehicles={data.vehicles} orders={data.orders} />

              {data.vehicles.map(v => (
                <Marker
                  key={`v-${v.id}`}
                  position={[v.current_lat || v.Warehouse?.latitude, v.current_lng || v.Warehouse?.longitude]}
                  icon={createCustomIcon(v.Status === '配送中' ? '#1890ff' : '#52c41a', 32)}
                  eventHandlers={{
                    click: () => setSelectedVehicle(v)
                  }}
                >
                  <Popup>
                    <strong>{v.plate_number}</strong><br />
                    状态: {v.status}<br />
                    司机: {v.Driver?.name || '未分配'}<br />
                    订单数: {v.orders?.length || 0}
                  </Popup>
                </Marker>
              ))}

              {data.vehicles.filter(v => v.status === '配送中' && v.orders?.length > 0).map(v => {
                const positions = []
                if (v.Warehouse) {
                  positions.push([v.Warehouse.latitude, v.Warehouse.longitude])
                }
                positions.push([v.current_lat, v.current_lng])
                v.orders.forEach(o => {
                  positions.push([o.latitude, o.longitude])
                })
                return (
                  <Polyline
                    key={`line-${v.id}`}
                    positions={positions}
                    color="#1890ff"
                    weight={3}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                )
              })}

              {data.orders.map(o => (
                <Marker
                  key={`o-${o.id}`}
                  position={[o.latitude, o.longitude]}
                  icon={orderIcon(o.status)}
                >
                  <Popup>
                    <strong>{o.customer_name}</strong><br />
                    订单号: {o.order_no}<br />
                    状态: {o.status}<br />
                    {o.warehouse?.name}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#1890ff', marginRight: 6 }}></span>配送中车辆</div>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#52c41a', marginRight: 6 }}></span>空闲车辆</div>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#fa8c16', marginRight: 6 }}></span>待配送订单</div>
            <div><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#52c41a', marginRight: 6 }}></span>已送达订单</div>
          </div>
        </div>

        <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <h3 style={{ marginBottom: 16 }}>车辆列表</h3>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div>
              {data.vehicles.map(v => (
                <div
                  key={v.id}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    border: selectedVehicle?.id === v.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedVehicle?.id === v.id ? '#e6f7ff' : '#fff'
                  }}
                  onClick={() => setSelectedVehicle(v)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong>{v.plate_number}</strong>
                    <StatusTag status={v.status} />
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    司机: {v.Driver?.name || '未分配'}<br />
                    仓库: {v.Warehouse?.name}<br />
                    位置: {(v.current_lat || 0).toFixed(4)}, {(v.current_lng || 0).toFixed(4)}
                  </div>
                  {v.status === '配送中' && v.orders?.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>当前配送 ({v.orders.length}单):</div>
                      {v.orders.map((o, idx) => (
                        <div key={o.id} style={{ fontSize: 12, padding: '2px 0' }}>
                          {idx + 1}. {o.customer_name} - <StatusTag status={o.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
