import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Warehouses from './pages/Warehouses.jsx'
import Drivers from './pages/Drivers.jsx'
import Vehicles from './pages/Vehicles.jsx'
import Orders from './pages/Orders.jsx'
import RouteOptimizer from './pages/RouteOptimizer.jsx'
import Tracking from './pages/Tracking.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="orders" element={<Orders />} />
        <Route path="optimizer" element={<RouteOptimizer />} />
        <Route path="tracking" element={<Tracking />} />
      </Route>
    </Routes>
  )
}
