import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { warehouseAPI, routeAPI, orderAPI } from '../api'
import { StatusTag } from '../components/Tags.jsx'

const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

const warehouseIcon = createCustomIcon('#1890ff')
const orderIcon = createCustomIcon('#52c41a')
const vehicleColors = ['#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d']

export default function RouteOptimizer() {
  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [optimizedRoutes, setOptimizedRoutes] = useState([])
  const [optimizing, setOptimizing] = useState(false)
  const [pendingOrders, setPendingOrders] = useState([])
  const [generations, setGenerations] = useState(500)
  const [population, setPopulation] = useState(100)
  const mapRef = useRef(null)

  useEffect(() => {
    loadWarehouses()
  }, [])

  useEffect(() => {
    if (selectedWarehouse) {
      loadPendingOrders()
    }
  }, [selectedWarehouse])

  const loadWarehouses = async () => {
    const res = await warehouseAPI.getAll()
    if (res.code === 0) {
      setWarehouses(res.data)
      if (res.data.length > 0) {
        setSelectedWarehouse(res.data[0].id)
      }
    }
  }

  const loadPendingOrders = async () => {
    const res = await orderAPI.getAll({ warehouse_id: selectedWarehouse, status: '待配送' })
    if (res.code === 0) {
      setPendingOrders(res.data)
    }
  }

  const handleOptimize = async () => {
    if (!selectedWarehouse) {
      alert('请先选择仓库')
      return
    }
    setOptimizing(true)
    try {
      const res = await routeAPI.optimize({
        warehouse_id: parseInt(selectedWarehouse),
        generations: parseInt(generations),
        population: parseInt(population)
      })
      if (res.code === 0) {
        setOptimizedRoutes(res.data)
      } else {
        alert(res.message)
      }
    } finally {
      setOptimizing(false)
    }
  }

  const handleSaveRoutes = async () => {
    if (optimizedRoutes.length === 0) {
      alert('没有可保存的路线')
      return
    }
    if (!confirm('确定保存并执行这些配送路线？订单将自动分配给对应车辆。')) {
      return
    }
    try {
      const res = await routeAPI.save(optimizedRoutes)
      if (res.code === 0) {
        alert('路线保存成功！')
        setOptimizedRoutes([])
        loadPendingOrders()
      }
    } catch (err) {
      console.error(err)
      alert('保存失败')
    }
  }

  const getWarehouse = () => warehouses.find(w => w.id == selectedWarehouse)

  const getMapCenter = () => {
    const wh = getWarehouse()
    if (wh) return [wh.latitude, wh.longitude]
    return [39.9042, 116.4074]
  }

  const getAllRoutePoints = () => {
    const points = []
    optimizedRoutes.forEach((route, rIdx) => {
      const color = vehicleColors[rIdx % vehicleColors.length]
      route.route_points.forEach(p => {
        points.push({ ...p, color, routeIdx })
      })
    })
    return points
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">路径优化</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleOptimize}
            disabled={optimizing}
          >
            {optimizing ? '优化计算中...' : '运行遗传算法优化'}
          </button>
          <button
            className="btn btn-success"
            onClick={handleSaveRoutes}
            disabled={optimizedRoutes.length === 0}
          >
            保存并执行路线
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <select
            className="form-select"
            value={selectedWarehouse}
            onChange={e => setSelectedWarehouse(e.target.value)}
          >
            <option value="">选择仓库</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>迭代次数:</label>
            <input
              type="number"
              className="form-input"
              style={{ width: 100 }}
              value={generations}
              onChange={e => setGenerations(e.target.value)}
              min="100"
              max="5000"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label>种群规模:</label>
            <input
              type="number"
              className="form-input"
              style={{ width: 100 }}
              value={population}
              onChange={e => setPopulation(e.target.value)}
              min="50"
              max="500"
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span>待配送订单: <strong>{pendingOrders.length}</strong> 单</span>
        </div>

        <div className="map-container">
          <MapContainer
            ref={mapRef}
            center={getMapCenter()}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {getWarehouse() && (
              <Marker
                position={[getWarehouse().latitude, getWarehouse().longitude]}
                icon={warehouseIcon}
              >
                <Popup>
                  <strong>{getWarehouse().name}</strong><br />
                  {getWarehouse().address}
                </Popup>
              </Marker>
            )}

            {optimizedRoutes.length === 0 && pendingOrders.map(order => (
              <Marker
                key={order.id}
                position={[order.latitude, order.longitude]}
                icon={orderIcon}
              >
                <Popup>
                  <strong>{order.customer_name}</strong><br />
                  订单号: {order.order_no}<br />
                  重量: {order.weight}kg
                </Popup>
              </Marker>
            ))}

            {optimizedRoutes.map((route, rIdx) => {
              const color = vehicleColors[rIdx % vehicleColors.length]
              const positions = route.route_points.map(p => [p.latitude, p.longitude])
              const vehicleIcon = createCustomIcon(color)

              return (
                <React.Fragment key={rIdx}>
                  <Polyline
                    positions={positions}
                    color={color}
                    weight={4}
                    opacity={0.8}
                  />
                  {route.route_points.map((p, pIdx) => {
                    if (p.type === 'warehouse') return null
                    return (
                      <Marker
                        key={`${rIdx}-${pIdx}`}
                        position={[p.latitude, p.longitude]}
                        icon={vehicleIcon}
                      >
                        <Popup>
                          路线 {rIdx + 1} - 第{pIdx}站<br />
                          车辆: {route.Vehicle?.plate_number || route.vehicle?.plate_number}<br />
                          {route.Orders?.find(o => o.id === p.order_id)?.customer_name || ''}
                        </Popup>
                      </Marker>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </MapContainer>
        </div>
      </div>

      {optimizedRoutes.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>优化结果（共 {optimizedRoutes.length} 条路线）</h3>
          <div className="route-list">
            {optimizedRoutes.map((route, idx) => (
              <div className="route-card" key={idx} style={{ borderLeftColor: vehicleColors[idx % vehicleColors.length] }}>
                <div className="route-card-header">
                  <span className="route-card-title">
                    路线 {idx + 1} - {route.Vehicle?.plate_number || route.vehicle?.plate_number}
                  </span>
                  <span className="tag tag-info">{route.Vehicle?.type || route.vehicle?.type}</span>
                </div>
                <div className="route-meta">
                  司机: {route.Vehicle?.driver?.name || route.vehicle?.driver?.name || '未分配'}<br />
                  总距离: <strong>{route.TotalDistance?.toFixed(2) || route.total_distance?.toFixed(2)} km</strong><br />
                  订单数: {route.Orders?.length || route.orders?.length} 单<br />
                  总载重: {route.TotalWeight?.toFixed(1) || route.total_weight?.toFixed(1)} kg / {route.Vehicle?.capacity || route.vehicle?.capacity} kg
                </div>
                <div className="route-orders">
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>配送顺序:</div>
                  {(route.Orders || route.orders || []).map((order, oIdx) => (
                    <div className="route-order-item" key={order.id}>
                      {oIdx + 1}. {order.customer_name} ({order.weight}kg)
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
