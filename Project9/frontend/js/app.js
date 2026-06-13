let currentPage = 'dashboard';
let paginationState = {
  equipment: { page: 1, pageSize: 10, total: 0 },
  maintenance: { page: 1, pageSize: 10, total: 0 },
  workOrders: { page: 1, pageSize: 10, total: 0 },
  inventory: { page: 1, pageSize: 10, total: 0 },
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboard();
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateToPage(page);
    });
  });
}

function navigateToPage(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  const titles = {
    dashboard: '数据概览',
    equipment: '设备管理',
    maintenance: '维保计划',
    workorders: '运维工单',
    inventory: '备件库存',
    health: '健康评估',
    system: '系统管理',
  };
  document.getElementById('pageTitle').textContent = titles[page] || '';

  currentPage = page;

  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'equipment': loadEquipment(); break;
    case 'maintenance': loadMaintenancePlans(); break;
    case 'workorders': loadWorkOrders(); break;
    case 'inventory': loadSpareParts(); break;
    case 'health': loadHealthPage(); break;
    case 'system': loadSystemPage(); break;
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatNumber(num) {
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }
  return num?.toLocaleString() || '0';
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

async function loadDashboard() {
  try {
    const [overview, activity] = await Promise.all([
      API.dashboard.getOverview(),
      API.dashboard.getActivity(),
    ]);

    renderStatsGrid(overview.summary);
    renderEquipmentStatusChart(overview.health_report);
    renderWorkOrderChart(overview.work_order_stats);
    renderHealthDistribution(overview.health_report);
    renderInventoryAlert(overview.inventory_stats);
    renderRecentActivity(activity);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderStatsGrid(summary) {
  const stats = [
    { label: '设备总数', value: summary.total_equipment, icon: '🔧', color: 'blue', change: `总价值 ¥${formatNumber(summary.total_equipment_value)}` },
    { label: '待处理工单', value: summary.pending_work_orders, icon: '📋', color: 'orange', change: `处理中 ${summary.in_progress_work_orders} 单` },
    { label: '库存总价值', value: `¥${formatNumber(summary.total_inventory_value)}`, icon: '📦', color: 'green', change: `库存不足 ${summary.low_stock_parts} 项` },
    { label: '平均健康度', value: `${summary.avg_health_score}%`, icon: '❤️', color: summary.avg_health_score >= 80 ? 'green' : (summary.avg_health_score >= 60 ? 'orange' : 'red'), change: `风险设备 ${summary.at_risk_equipment} 台` },
  ];

  document.getElementById('statsGrid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">${s.label}</span>
        <span class="stat-icon ${s.color}">${s.icon}</span>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-change">${s.change}</div>
    </div>
  `).join('');
}

function renderEquipmentStatusChart(report) {
  const container = document.getElementById('equipmentStatusChart');
  const dist = report.health_distribution;
  const total = report.total_equipment;

  const colors = {
    excellent: '#52c41a',
    good: '#1890ff',
    fair: '#faad14',
    poor: '#fa8c16',
    critical: '#f5222d',
  };

  const labels = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差',
    critical: '严重',
  };

  let conicGradient = '';
  let currentAngle = 0;

  Object.entries(dist).forEach(([key, value]) => {
    if (value > 0) {
      const angle = (value / total) * 360;
      conicGradient += `${colors[key]} ${currentAngle}deg ${currentAngle + angle}deg, `;
      currentAngle += angle;
    }
  });
  conicGradient = conicGradient.slice(0, -2);

  const legend = Object.entries(dist).filter(([_, v]) => v > 0).map(([key, value]) => `
    <div class="legend-item">
      <span class="legend-color" style="background:${colors[key]}"></span>
      <span>${labels[key]}: ${value}台 (${Math.round(value / total * 100)}%)</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:40px;">
      <div class="donut-chart" style="background:conic-gradient(${conicGradient})">
        <div class="donut-center">
          <div class="donut-value">${total}</div>
          <div class="donut-label">设备总数</div>
        </div>
      </div>
      <div class="legend">${legend}</div>
    </div>
  `;
}

function renderWorkOrderChart(stats) {
  const container = document.getElementById('workOrderChart');
  const data = stats.by_status;

  const max = Math.max(...data.map(d => d.count), 1);

  const chart = data.map(d => {
    const height = (d.count / max) * 200;
    let color = '#1890ff';
    if (d.status === 'completed') color = '#52c41a';
    if (d.status === 'pending') color = '#faad14';
    if (d.status === 'in_progress') color = '#1890ff';
    if (d.status === 'cancelled') color = '#8c8c8c';

    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="font-weight:600;color:#262626;">${d.count}</div>
        <div class="chart-bar" style="height:${Math.max(height, 20)}px;background:${color};min-height:4px;"></div>
        <div style="font-size:12px;color:#8c8c8c;">${d.status_text}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="chart-container">${chart}</div>`;
}

function renderHealthDistribution(report) {
  const container = document.getElementById('healthDistribution');
  const atRisk = report.at_risk_equipment;

  if (atRisk.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <div>所有设备运行正常，无风险设备</div>
      </div>
    `;
    return;
  }

  const list = atRisk.slice(0, 5).map(e => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f0f0f0;">
      <div>
        <div style="font-weight:500;margin-bottom:4px;">${e.name}</div>
        <div style="font-size:12px;color:#8c8c8c;">${e.equipment_code}</div>
      </div>
      <span class="status-badge health-${e.assessment.level}">健康度 ${e.health_score}%</span>
    </div>
  `).join('');

  container.innerHTML = list;
}

function renderInventoryAlert(stats) {
  const container = document.getElementById('inventoryAlert');
  
  if (stats.low_stock_count === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <div>库存充足，无预警</div>
      </div>
    `;
    return;
  }

  const lowStock = stats.low_stock_count;
  const overStock = stats.over_stock_count;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#fff7e6;border-radius:8px;">
        <div style="font-size:40px;">⚠️</div>
        <div>
          <div style="font-size:24px;font-weight:700;color:#fa8c16;">${lowStock}</div>
          <div style="color:#8c8c8c;">库存不足的备件</div>
        </div>
      </div>
      ${overStock > 0 ? `
        <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#e6f7ff;border-radius:8px;">
          <div style="font-size:40px;">📊</div>
          <div>
            <div style="font-size:24px;font-weight:700;color:#1890ff;">${overStock}</div>
            <div style="color:#8c8c8c;">库存过高的备件</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderRecentActivity(activity) {
  const container = document.getElementById('recentActivity');
  const records = activity.recent_lifecycle_records.slice(0, 10);

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div>暂无活动记录</div>
      </div>
    `;
    return;
  }

  const timeline = records.map(r => `
    <div class="timeline-item ${r.stage}">
      <div class="timeline-date">${formatDateTime(r.record_date)}</div>
      <div class="timeline-title">${r.equipment_name} - ${r.action}</div>
      <div class="timeline-desc">${r.description} (${r.operator})</div>
    </div>
  `).join('');

  container.innerHTML = `<div class="timeline">${timeline}</div>`;
}

function renderPagination(type, state) {
  const totalPages = Math.ceil(state.total / state.pageSize);
  const container = document.getElementById(`${type}Pagination`);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let buttons = '';
  buttons += `<button class="page-btn" onclick="changePage('${type}', ${state.page - 1})" ${state.page === 1 ? 'disabled' : ''}>上一页</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= state.page - 2 && i <= state.page + 2)) {
      buttons += `<button class="page-btn ${i === state.page ? 'active' : ''}" onclick="changePage('${type}', ${i})">${i}</button>`;
    } else if (i === state.page - 3 || i === state.page + 3) {
      buttons += `<span style="padding:0 8px;">...</span>`;
    }
  }

  buttons += `<button class="page-btn" onclick="changePage('${type}', ${state.page + 1})" ${state.page === totalPages ? 'disabled' : ''}>下一页</button>`;
  buttons += `<span style="margin-left:12px;color:#8c8c8c;font-size:13px;">共 ${state.total} 条</span>`;

  container.innerHTML = buttons;
}

function changePage(type, page) {
  if (page < 1) return;
  const state = paginationState[type];
  const totalPages = Math.ceil(state.total / state.pageSize);
  if (page > totalPages) return;

  state.page = page;
  const loaders = {
    equipment: loadEquipment,
    maintenance: loadMaintenancePlans,
    workOrders: loadWorkOrders,
    inventory: loadSpareParts,
  };
  loaders[type]();
}

function showModal(content) {
  document.getElementById('modalContent').innerHTML = content;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

async function loadEquipment() {
  try {
    const status = document.getElementById('equipStatusFilter')?.value || '';
    const category = document.getElementById('equipCategoryFilter')?.value || '';
    const keyword = document.getElementById('equipKeyword')?.value || '';
    const state = paginationState.equipment;

    const result = await API.equipment.getAll({
      page: state.page,
      pageSize: state.pageSize,
      status,
      category,
      keyword,
    });

    state.total = result.total;
    renderEquipmentTable(result.list);
    renderPagination('equipment', state);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderEquipmentTable(list) {
  const tbody = document.getElementById('equipmentTbody');
  
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state" style="padding:40px;"><div class="empty-state-icon">🔧</div><div>暂无设备数据</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td style="font-family:monospace;">${e.equipment_code}</td>
      <td style="font-weight:500;">${e.name}</td>
      <td>${e.category}</td>
      <td>${e.model || '-'}</td>
      <td>${e.location || '-'}</td>
      <td><span class="status-badge status-${e.status}">${e.status_text}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="width:80px;">
            <div class="progress-fill ${e.health_score >= 80 ? 'success' : e.health_score >= 60 ? 'warning' : 'danger'}" style="width:${e.health_score}%"></div>
          </div>
          <span>${e.health_score}%</span>
        </div>
      </td>
      <td>${e.purchase_date || '-'}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="showEquipmentDetail(${e.id})">详情</button>
          ${e.status === 'purchased' ? `<button class="btn btn-sm btn-success" onclick="installEquipment(${e.id})">安装</button>` : ''}
          ${e.status === 'installed' ? `<button class="btn btn-sm btn-success" onclick="startEquipment(${e.id})">投运</button>` : ''}
          ${e.status !== 'scrapped' && e.status !== 'purchased' ? `<button class="btn btn-sm btn-warning" onclick="scrapEquipment(${e.id})">报废</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function showEquipmentModal(equipment = null) {
  const today = new Date().toISOString().split('T')[0];
  const isEdit = !!equipment;

  const content = `
    <div class="modal-header">
      <div class="modal-title">${isEdit ? '编辑设备' : '新增设备'}</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">设备编号 *</label>
          <input type="text" class="form-input" id="equipCode" value="${equipment?.equipment_code || ''}" placeholder="如：EQ-2024-001">
        </div>
        <div class="form-group">
          <label class="form-label">设备名称 *</label>
          <input type="text" class="form-input" id="equipName" value="${equipment?.name || ''}" placeholder="请输入设备名称">
        </div>
        <div class="form-group">
          <label class="form-label">设备类别 *</label>
          <select class="form-select" id="equipCategory">
            <option value="金属加工" ${equipment?.category === '金属加工' ? 'selected' : ''}>金属加工</option>
            <option value="自动化" ${equipment?.category === '自动化' ? 'selected' : ''}>自动化</option>
            <option value="动力设备" ${equipment?.category === '动力设备' ? 'selected' : ''}>动力设备</option>
            <option value="塑料成型" ${equipment?.category === '塑料成型' ? 'selected' : ''}>塑料成型</option>
            <option value="物流设备" ${equipment?.category === '物流设备' ? 'selected' : ''}>物流设备</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">型号规格</label>
          <input type="text" class="form-input" id="equipModel" value="${equipment?.model || ''}" placeholder="请输入型号">
        </div>
        <div class="form-group">
          <label class="form-label">制造厂商</label>
          <input type="text" class="form-input" id="equipManufacturer" value="${equipment?.manufacturer || ''}" placeholder="请输入制造厂商">
        </div>
        <div class="form-group">
          <label class="form-label">序列号</label>
          <input type="text" class="form-input" id="equipSerial" value="${equipment?.serial_number || ''}" placeholder="请输入序列号">
        </div>
        <div class="form-group">
          <label class="form-label">采购日期</label>
          <input type="date" class="form-input" id="equipPurchaseDate" value="${equipment?.purchase_date || today}">
        </div>
        <div class="form-group">
          <label class="form-label">采购价格 (元)</label>
          <input type="number" class="form-input" id="equipPrice" value="${equipment?.purchase_price || ''}" placeholder="请输入采购价格">
        </div>
        <div class="form-group">
          <label class="form-label">供应商</label>
          <input type="text" class="form-input" id="equipSupplier" value="${equipment?.supplier || ''}" placeholder="请输入供应商">
        </div>
        <div class="form-group">
          <label class="form-label">安装位置</label>
          <input type="text" class="form-input" id="equipLocation" value="${equipment?.location || ''}" placeholder="如：一号车间A区">
        </div>
        <div class="form-group">
          <label class="form-label">安装日期</label>
          <input type="date" class="form-input" id="equipInstallDate" value="${equipment?.install_date || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">保修开始</label>
          <input type="date" class="form-input" id="equipWarrantyStart" value="${equipment?.warranty_start || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">保修结束</label>
          <input type="date" class="form-input" id="equipWarrantyEnd" value="${equipment?.warranty_end || ''}">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">设备描述</label>
        <textarea class="form-textarea" id="equipDescription" placeholder="请输入设备描述">${equipment?.description || ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveEquipment(${equipment?.id || 'null'})">保存</button>
    </div>
  `;

  showModal(content);
}

async function saveEquipment(id) {
  try {
    const data = {
      equipment_code: document.getElementById('equipCode').value,
      name: document.getElementById('equipName').value,
      category: document.getElementById('equipCategory').value,
      model: document.getElementById('equipModel').value,
      manufacturer: document.getElementById('equipManufacturer').value,
      serial_number: document.getElementById('equipSerial').value,
      purchase_date: document.getElementById('equipPurchaseDate').value,
      purchase_price: parseFloat(document.getElementById('equipPrice').value) || 0,
      supplier: document.getElementById('equipSupplier').value,
      location: document.getElementById('equipLocation').value,
      install_date: document.getElementById('equipInstallDate').value || null,
      warranty_start: document.getElementById('equipWarrantyStart').value || null,
      warranty_end: document.getElementById('equipWarrantyEnd').value || null,
      description: document.getElementById('equipDescription').value,
    };

    if (!data.equipment_code || !data.name || !data.category) {
      showToast('请填写必填项', 'warning');
      return;
    }

    if (id) {
      await API.equipment.update(id, data);
      showToast('设备更新成功', 'success');
    } else {
      await API.equipment.create(data);
      showToast('设备创建成功', 'success');
    }

    closeModal();
    loadEquipment();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showEquipmentDetail(id) {
  try {
    const equip = await API.equipment.getById(id);
    
    const content = `
      <div class="modal-header">
        <div class="modal-title">设备详情 - ${equip.name}</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="tabs">
          <div class="tab active" onclick="switchDetailTab(event, 'info')">基本信息</div>
          <div class="tab" onclick="switchDetailTab(event, 'lifecycle')">生命周期</div>
          <div class="tab" onclick="switchDetailTab(event, 'maintenance')">维保计划</div>
          <div class="tab" onclick="switchDetailTab(event, 'workorders')">工单记录</div>
          <div class="tab" onclick="switchDetailTab(event, 'health')">健康记录</div>
        </div>

        <div class="tab-content active" id="tab-info">
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">设备编号</span><span class="detail-value">${equip.equipment_code}</span></div>
            <div class="detail-item"><span class="detail-label">设备名称</span><span class="detail-value">${equip.name}</span></div>
            <div class="detail-item"><span class="detail-label">设备类别</span><span class="detail-value">${equip.category}</span></div>
            <div class="detail-item"><span class="detail-label">型号</span><span class="detail-value">${equip.model || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">制造厂商</span><span class="detail-value">${equip.manufacturer || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">序列号</span><span class="detail-value">${equip.serial_number || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">采购日期</span><span class="detail-value">${equip.purchase_date || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">采购价格</span><span class="detail-value">¥${equip.purchase_price?.toFixed(2) || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">供应商</span><span class="detail-value">${equip.supplier || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">安装位置</span><span class="detail-value">${equip.location || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">安装日期</span><span class="detail-value">${equip.install_date || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">设备状态</span><span class="detail-value"><span class="status-badge status-${equip.status}">${equip.status_text}</span></span></div>
            <div class="detail-item"><span class="detail-label">健康度</span><span class="detail-value">
              <div style="display:flex;align-items:center;gap:8px;">
                <div class="progress-bar" style="width:100px;">
                  <div class="progress-fill ${equip.health_score >= 80 ? 'success' : equip.health_score >= 60 ? 'warning' : 'danger'}" style="width:${equip.health_score}%"></div>
                </div>
                <span style="font-weight:600;">${equip.health_score}%</span>
              </div>
            </span></div>
            <div class="detail-item"><span class="detail-label">保修期限</span><span class="detail-value">${equip.warranty_start || '-'} 至 ${equip.warranty_end || '-'}</span></div>
          </div>
          <div class="divider"></div>
          <div class="detail-item">
            <span class="detail-label">设备描述</span>
            <span class="detail-value" style="font-weight:400;">${equip.description || '暂无描述'}</span>
          </div>
        </div>

        <div class="tab-content" id="tab-lifecycle">
          <div class="timeline">
            ${equip.lifecycle_records.map(r => `
              <div class="timeline-item ${r.stage}">
                <div class="timeline-date">${formatDateTime(r.record_date)}</div>
                <div class="timeline-title">${r.action}</div>
                <div class="timeline-desc">${r.description || ''} (操作人：${r.operator || '-'})</div>
              </div>
            `).join('') || '<div class="empty-state"><div class="empty-state-icon">📝</div><div>暂无生命周期记录</div></div>'}
          </div>
        </div>

        <div class="tab-content" id="tab-maintenance">
          ${equip.maintenance_plans.length > 0 ? `
            <table class="data-table">
              <thead><tr><th>计划名称</th><th>类型</th><th>频率</th><th>下次执行</th><th>状态</th></tr></thead>
              <tbody>
                ${equip.maintenance_plans.map(p => `
                  <tr>
                    <td>${p.plan_name}</td>
                    <td>${p.plan_type === 'major' ? '大型检修' : '常规保养'}</td>
                    <td>${p.interval_days}天</td>
                    <td>${p.next_maintenance_date || '-'}</td>
                    <td><span class="status-badge ${p.is_active ? 'status-running' : 'status-scrapped'}">${p.is_active ? '启用' : '停用'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><div class="empty-state-icon">📅</div><div>暂无维保计划</div></div>'}
        </div>

        <div class="tab-content" id="tab-workorders">
          ${equip.work_orders.length > 0 ? `
            <table class="data-table">
              <thead><tr><th>工单号</th><th>标题</th><th>类型</th><th>状态</th><th>创建时间</th></tr></thead>
              <tbody>
                ${equip.work_orders.map(w => `
                  <tr>
                    <td style="font-family:monospace;">${w.order_no}</td>
                    <td>${w.title}</td>
                    <td>${w.order_type === 'repair' ? '维修' : '维保'}</td>
                    <td><span class="status-badge status-${w.status === 'completed' ? 'running' : w.status}">${w.status}</span></td>
                    <td>${formatDateTime(w.created_at)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><div class="empty-state-icon">📋</div><div>暂无工单记录</div></div>'}
        </div>

        <div class="tab-content" id="tab-health">
          ${equip.health_records.length > 0 ? `
            <table class="data-table">
              <thead><tr><th>检查时间</th><th>健康度</th><th>温度</th><th>振动</th><th>压力</th><th>评估</th></tr></thead>
              <tbody>
                ${equip.health_records.map(h => `
                  <tr>
                    <td>${formatDateTime(h.check_date)}</td>
                    <td><span class="status-badge health-${h.health_score >= 90 ? 'excellent' : h.health_score >= 75 ? 'good' : h.health_score >= 60 ? 'fair' : 'poor'}">${h.health_score}%</span></td>
                    <td>${h.temperature}°C</td>
                    <td>${h.vibration}mm/s</td>
                    <td>${h.pressure}MPa</td>
                    <td>${h.assessment || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="empty-state"><div class="empty-state-icon">❤️</div><div>暂无健康记录</div></div>'}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">关闭</button>
        <button class="btn btn-primary" onclick="editEquipment(${equip.id})">编辑</button>
        <button class="btn btn-success" onclick="checkEquipmentHealth(${equip.id});closeModal();">健康检查</button>
      </div>
    `;

    showModal(content);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function switchDetailTab(event, tabName) {
  event.target.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  event.target.parentElement.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

async function editEquipment(id) {
  const equip = await API.equipment.getById(id);
  showEquipmentModal(equip);
}

async function installEquipment(id) {
  const today = new Date().toISOString().split('T')[0];
  const content = `
    <div class="modal-header">
      <div class="modal-title">设备安装</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">安装日期</label>
          <input type="date" class="form-input" id="installDate" value="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">安装位置</label>
          <input type="text" class="form-input" id="installLocation" placeholder="如：一号车间A区">
        </div>
        <div class="form-group">
          <label class="form-label">操作人</label>
          <input type="text" class="form-input" id="installOperator" value="系统管理员">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">安装说明</label>
        <textarea class="form-textarea" id="installDesc" placeholder="请输入安装调试说明">设备安装调试完成，各项参数正常</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="submitInstall(${id})">确认安装</button>
    </div>
  `;
  showModal(content);
}

async function submitInstall(id) {
  try {
    await API.equipment.install(id, {
      install_date: document.getElementById('installDate').value,
      location: document.getElementById('installLocation').value,
      operator: document.getElementById('installOperator').value,
      description: document.getElementById('installDesc').value,
    });
    showToast('设备安装成功', 'success');
    closeModal();
    loadEquipment();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function startEquipment(id) {
  if (!confirm('确认将该设备投入运行？')) return;
  try {
    await API.equipment.start(id, '系统管理员');
    showToast('设备已投入运行', 'success');
    loadEquipment();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function scrapEquipment(id) {
  const content = `
    <div class="modal-header">
      <div class="modal-title">设备报废</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">操作人</label>
        <input type="text" class="form-input" id="scrapOperator" value="系统管理员">
      </div>
      <div class="form-group mt-16">
        <label class="form-label">报废原因</label>
        <textarea class="form-textarea" id="scrapReason" placeholder="请输入报废原因">设备达到使用年限，正常报废</textarea>
      </div>
      <div style="margin-top:16px;padding:16px;background:#fff1f0;border-radius:8px;color:#f5222d;">
        ⚠️ 报废操作不可逆，请确认信息无误
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-danger" onclick="submitScrap(${id})">确认报废</button>
    </div>
  `;
  showModal(content);
}

async function submitScrap(id) {
  try {
    await API.equipment.scrap(id, {
      operator: document.getElementById('scrapOperator').value,
      reason: document.getElementById('scrapReason').value,
    });
    showToast('设备已报废', 'success');
    closeModal();
    loadEquipment();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadMaintenancePlans() {
  try {
    const isActive = document.getElementById('planStatusFilter')?.value;
    const state = paginationState.maintenance;

    const result = await API.maintenance.getAll({
      page: state.page,
      pageSize: state.pageSize,
      isActive: isActive !== '' ? isActive : undefined,
    });

    state.total = result.total;
    renderMaintenanceTable(result.list);
    renderPagination('maintenance', state);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderMaintenanceTable(list) {
  const tbody = document.getElementById('maintenanceTbody');

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📅</div><div>暂无维保计划</div></div></td></tr>';
    return;
  }

  const typeText = { routine: '常规保养', major: '大型检修' };
  const freqText = { daily: '每日', weekly: '每周', monthly: '每月', quarterly: '每季度', yearly: '每年' };

  tbody.innerHTML = list.map(p => `
    <tr>
      <td style="font-weight:500;">${p.plan_name}</td>
      <td>${p.equipment_name || '-'}</td>
      <td><span class="status-badge priority-${p.plan_type === 'major' ? 'high' : 'normal'}">${typeText[p.plan_type] || p.plan_type}</span></td>
      <td>${freqText[p.frequency] || p.frequency} (${p.interval_days}天)</td>
      <td>${p.next_maintenance_date || '-'}</td>
      <td><span class="status-badge ${p.is_active ? 'status-running' : 'status-scrapped'}">${p.is_active ? '启用中' : '已停用'}</span></td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="showMaintenanceDetail(${p.id})">详情</button>
          ${p.is_active ? `<button class="btn btn-sm btn-success" onclick="triggerMaintenance(${p.id})">执行</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function showMaintenanceModal() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const content = `
    <div class="modal-header">
      <div class="modal-title">新增维保计划</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">关联设备 *</label>
        <select class="form-select" id="planEquipment">
          <option value="">请选择设备</option>
        </select>
      </div>
      <div class="form-grid mt-16">
        <div class="form-group">
          <label class="form-label">计划名称 *</label>
          <input type="text" class="form-input" id="planName" placeholder="请输入计划名称">
        </div>
        <div class="form-group">
          <label class="form-label">计划类型 *</label>
          <select class="form-select" id="planType">
            <option value="routine">常规保养</option>
            <option value="major">大型检修</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">执行频率 *</label>
          <select class="form-select" id="planFrequency" onchange="updateIntervalDays()">
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="monthly" selected>每月</option>
            <option value="quarterly">每季度</option>
            <option value="yearly">每年</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">间隔天数 *</label>
          <input type="number" class="form-input" id="planInterval" value="30">
        </div>
        <div class="form-group">
          <label class="form-label">下次执行日期 *</label>
          <input type="date" class="form-input" id="planNextDate" value="${nextWeek.toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">计划描述</label>
        <textarea class="form-textarea" id="planDesc" placeholder="请输入维保内容说明"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveMaintenancePlan()">保存</button>
    </div>
  `;
  showModal(content);
  loadEquipmentOptions('planEquipment');
}

function updateIntervalDays() {
  const freq = document.getElementById('planFrequency').value;
  const map = { daily: 1, weekly: 7, monthly: 30, quarterly: 90, yearly: 365 };
  document.getElementById('planInterval').value = map[freq];
}

async function loadEquipmentOptions(selectId, selectedId = null) {
  try {
    const result = await API.equipment.getAll({ pageSize: 100 });
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">请选择设备</option>' + result.list.map(e => 
        `<option value="${e.id}" ${selectedId == e.id ? 'selected' : ''}>${e.equipment_code} - ${e.name}</option>`
      ).join('');
    }
  } catch (error) {
    console.error('Load equipment options failed:', error);
  }
}

async function saveMaintenancePlan() {
  try {
    const data = {
      equipment_id: parseInt(document.getElementById('planEquipment').value),
      plan_name: document.getElementById('planName').value,
      plan_type: document.getElementById('planType').value,
      frequency: document.getElementById('planFrequency').value,
      interval_days: parseInt(document.getElementById('planInterval').value),
      next_maintenance_date: document.getElementById('planNextDate').value,
      description: document.getElementById('planDesc').value,
    };

    if (!data.equipment_id || !data.plan_name) {
      showToast('请填写必填项', 'warning');
      return;
    }

    await API.maintenance.create(data);
    showToast('维保计划创建成功', 'success');
    closeModal();
    loadMaintenancePlans();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showMaintenanceDetail(id) {
  try {
    const plan = await API.maintenance.getById(id);

    const content = `
      <div class="modal-header">
        <div class="modal-title">维保计划详情</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">计划名称</span><span class="detail-value">${plan.plan_name}</span></div>
          <div class="detail-item"><span class="detail-label">关联设备</span><span class="detail-value">${plan.equipment_name || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">计划类型</span><span class="detail-value">${plan.plan_type === 'major' ? '大型检修' : '常规保养'}</span></div>
          <div class="detail-item"><span class="detail-label">执行频率</span><span class="detail-value">${plan.frequency} (${plan.interval_days}天)</span></div>
          <div class="detail-item"><span class="detail-label">上次执行</span><span class="detail-value">${plan.last_maintenance_date || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">下次执行</span><span class="detail-value">${plan.next_maintenance_date || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value"><span class="status-badge ${plan.is_active ? 'status-running' : 'status-scrapped'}">${plan.is_active ? '启用中' : '已停用'}</span></span></div>
        </div>
        <div class="divider"></div>
        <div class="detail-item">
          <span class="detail-label">计划描述</span>
          <span class="detail-value" style="font-weight:400;">${plan.description || '暂无描述'}</span>
        </div>
        <div class="divider"></div>
        <div style="font-weight:600;margin-bottom:12px;">关联工单 (${plan.work_orders?.length || 0})</div>
        ${plan.work_orders?.length > 0 ? `
          <table class="data-table">
            <thead><tr><th>工单号</th><th>标题</th><th>状态</th><th>创建时间</th></tr></thead>
            <tbody>
              ${plan.work_orders.slice(0, 5).map(w => `
                <tr>
                  <td>${w.order_no}</td>
                  <td>${w.title}</td>
                  <td>${w.status}</td>
                  <td>${formatDateTime(w.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state" style="padding:20px;"><div>暂无关联工单</div></div>'}
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">关闭</button>
        ${plan.is_active ? `<button class="btn btn-success" onclick="triggerMaintenance(${plan.id});closeModal();">立即执行</button>` : ''}
      </div>
    `;
    showModal(content);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function triggerMaintenance(id) {
  try {
    await API.maintenance.trigger(id);
    showToast('维保已触发，工单即将生成', 'success');
    loadMaintenancePlans();
    setTimeout(loadWorkOrders, 1000);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadWorkOrders() {
  try {
    const status = document.getElementById('woStatusFilter')?.value || '';
    const priority = document.getElementById('woPriorityFilter')?.value || '';
    const type = document.getElementById('woTypeFilter')?.value || '';
    const state = paginationState.workOrders;

    const result = await API.workOrders.getAll({
      page: state.page,
      pageSize: state.pageSize,
      status,
      priority,
      type,
    });

    state.total = result.total;
    renderWorkOrderTable(result.list);
    renderPagination('workOrders', state);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderWorkOrderTable(list) {
  const tbody = document.getElementById('workOrderTbody');

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📋</div><div>暂无工单数据</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(w => `
    <tr>
      <td style="font-family:monospace;">${w.order_no}</td>
      <td style="font-weight:500;">${w.title}</td>
      <td>${w.equipment_name || '-'}</td>
      <td><span class="status-badge priority-${w.order_type === 'repair' ? 'high' : 'normal'}">${w.type_text}</span></td>
      <td><span class="status-badge priority-${w.priority}">${w.priority_text}</span></td>
      <td><span class="status-badge status-${w.status === 'completed' ? 'running' : (w.status === 'in_progress' ? 'maintenance' : w.status)}">${w.status_text}</span></td>
      <td>${w.assigned_to || '-'}</td>
      <td>${formatDateTime(w.created_at)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="showWorkOrderDetail(${w.id})">详情</button>
          ${w.status === 'pending' || w.status === 'assigned' ? `<button class="btn btn-sm btn-success" onclick="startWork(${w.id})">开始</button>` : ''}
          ${w.status === 'in_progress' ? `<button class="btn btn-sm btn-success" onclick="completeWork(${w.id})">完成</button>` : ''}
          ${w.status !== 'completed' && w.status !== 'cancelled' ? `<button class="btn btn-sm btn-danger" onclick="cancelWork(${w.id})">取消</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function showWorkOrderModal() {
  const content = `
    <div class="modal-header">
      <div class="modal-title">新增工单</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">关联设备 *</label>
        <select class="form-select" id="woEquipment">
          <option value="">请选择设备</option>
        </select>
      </div>
      <div class="form-grid mt-16">
        <div class="form-group">
          <label class="form-label">工单标题 *</label>
          <input type="text" class="form-input" id="woTitle" placeholder="请输入工单标题">
        </div>
        <div class="form-group">
          <label class="form-label">工单类型</label>
          <select class="form-select" id="woType">
            <option value="maintenance">维保</option>
            <option value="repair">维修</option>
            <option value="inspection">巡检</option>
            <option value="upgrade">升级</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">优先级</label>
          <select class="form-select" id="woPriority">
            <option value="low">低</option>
            <option value="normal" selected>普通</option>
            <option value="high">高</option>
            <option value="urgent">紧急</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">计划执行日期</label>
          <input type="date" class="form-input" id="woScheduledDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">工单描述</label>
        <textarea class="form-textarea" id="woDesc" placeholder="请详细描述工作内容"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveWorkOrder()">保存</button>
    </div>
  `;
  showModal(content);
  loadEquipmentOptions('woEquipment');
}

async function saveWorkOrder() {
  try {
    const data = {
      equipment_id: parseInt(document.getElementById('woEquipment').value),
      title: document.getElementById('woTitle').value,
      order_type: document.getElementById('woType').value,
      priority: document.getElementById('woPriority').value,
      scheduled_date: document.getElementById('woScheduledDate').value,
      description: document.getElementById('woDesc').value,
    };

    if (!data.equipment_id || !data.title) {
      showToast('请填写必填项', 'warning');
      return;
    }

    await API.workOrders.create(data);
    showToast('工单创建成功', 'success');
    closeModal();
    loadWorkOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showWorkOrderDetail(id) {
  try {
    const order = await API.workOrders.getById(id);

    const content = `
      <div class="modal-header">
        <div class="modal-title">工单详情 - ${order.order_no}</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">工单号</span><span class="detail-value" style="font-family:monospace;">${order.order_no}</span></div>
          <div class="detail-item"><span class="detail-label">标题</span><span class="detail-value">${order.title}</span></div>
          <div class="detail-item"><span class="detail-label">关联设备</span><span class="detail-value">${order.equipment_name || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">工单类型</span><span class="detail-value">${order.type_text}</span></div>
          <div class="detail-item"><span class="detail-label">优先级</span><span class="detail-value"><span class="status-badge priority-${order.priority}">${order.priority_text}</span></span></div>
          <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value"><span class="status-badge status-${order.status === 'completed' ? 'running' : order.status}">${order.status_text}</span></span></div>
          <div class="detail-item"><span class="detail-label">负责人</span><span class="detail-value">${order.assigned_to || '未指派'}</span></div>
          <div class="detail-item"><span class="detail-label">计划日期</span><span class="detail-value">${order.scheduled_date || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">完成日期</span><span class="detail-value">${order.completed_date || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">工单费用</span><span class="detail-value">¥${order.cost?.toFixed(2) || '0.00'}</span></div>
        </div>
        <div class="divider"></div>
        <div class="detail-item">
          <span class="detail-label">工单描述</span>
          <span class="detail-value" style="font-weight:400;white-space:pre-wrap;">${order.description || '暂无描述'}</span>
        </div>
        ${order.inventory_transactions?.length > 0 ? `
          <div class="divider"></div>
          <div style="font-weight:600;margin-bottom:12px;">使用的备件</div>
          <table class="data-table">
            <thead><tr><th>备件名称</th><th>数量</th><th>操作人</th><th>时间</th></tr></thead>
            <tbody>
              ${order.inventory_transactions.map(t => `
                <tr>
                  <td>${t.part_name}</td>
                  <td>${t.quantity}</td>
                  <td>${t.operator || '-'}</td>
                  <td>${formatDateTime(t.transaction_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">关闭</button>
        ${order.status === 'pending' || order.status === 'assigned' ? `<button class="btn btn-success" onclick="startWork(${order.id});closeModal();">开始处理</button>` : ''}
        ${order.status === 'in_progress' ? `<button class="btn btn-success" onclick="showCompleteModal(${order.id})">完成工单</button>` : ''}
        ${order.status !== 'completed' && order.status !== 'cancelled' ? `<button class="btn btn-danger" onclick="cancelWork(${order.id});closeModal();">取消工单</button>` : ''}
      </div>
    `;
    showModal(content);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function startWork(id) {
  if (!confirm('确认开始处理此工单？')) return;
  try {
    await API.workOrders.start(id, '系统管理员');
    showToast('工单已开始处理', 'success');
    loadWorkOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function showCompleteModal(id) {
  const content = `
    <div class="modal-header">
      <div class="modal-title">完成工单</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">处理结果</label>
          <textarea class="form-textarea" id="completeRemark" placeholder="请描述处理结果和详情"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">费用 (元)</label>
          <input type="number" class="form-input" id="completeCost" value="0">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-success" onclick="submitComplete(${id})">确认完成</button>
    </div>
  `;
  showModal(content);
}

async function submitComplete(id) {
  try {
    await API.workOrders.complete(id, {
      remark: document.getElementById('completeRemark').value,
      cost: parseFloat(document.getElementById('completeCost').value) || 0,
    });
    showToast('工单已完成', 'success');
    closeModal();
    loadWorkOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function cancelWork(id) {
  const reason = prompt('请输入取消原因：', '');
  if (reason === null) return;
  try {
    await API.workOrders.cancel(id, reason);
    showToast('工单已取消', 'success');
    loadWorkOrders();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadSpareParts() {
  try {
    const stockStatus = document.getElementById('stockStatusFilter')?.value;
    const keyword = document.getElementById('partKeyword')?.value || '';
    const state = paginationState.inventory;

    const result = await API.inventory.getAll({
      page: state.page,
      pageSize: state.pageSize,
      lowStock: stockStatus === 'low' ? 1 : undefined,
      keyword,
    });

    let filteredList = result.list;
    if (stockStatus === 'normal') {
      filteredList = result.list.filter(p => p.stock_status === 'normal');
    } else if (stockStatus === 'overstock') {
      filteredList = result.list.filter(p => p.stock_status === 'overstock');
    }

    state.total = stockStatus && stockStatus !== '' ? filteredList.length : result.total;
    renderPartsTable(filteredList);
    renderPagination('inventory', state);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderPartsTable(list) {
  const tbody = document.getElementById('partsTbody');

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state" style="padding:40px;"><div class="empty-state-icon">📦</div><div>暂无备件数据</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td style="font-family:monospace;">${p.part_code}</td>
      <td style="font-weight:500;">${p.name}</td>
      <td>${p.specification || '-'}</td>
      <td>${p.unit || '-'}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          ${p.quantity}
          ${p.quantity <= p.min_stock ? '<span style="color:#f5222d;">⚠️</span>' : ''}
        </div>
      </td>
      <td><span class="status-badge stock-${p.stock_status}">${p.stock_status_text}</span></td>
      <td>¥${p.unit_price?.toFixed(2) || '-'}</td>
      <td>${p.location || '-'}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" onclick="showPartDetail(${p.id})">详情</button>
          <button class="btn btn-sm btn-success" onclick="stockIn(${p.id})">入库</button>
          <button class="btn btn-sm btn-warning" onclick="stockOut(${p.id})">出库</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function showPartModal() {
  const content = `
    <div class="modal-header">
      <div class="modal-title">新增备件</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">备件编号 *</label>
          <input type="text" class="form-input" id="partCode" placeholder="如：SP-001">
        </div>
        <div class="form-group">
          <label class="form-label">备件名称 *</label>
          <input type="text" class="form-input" id="partName" placeholder="请输入备件名称">
        </div>
        <div class="form-group">
          <label class="form-label">类别</label>
          <input type="text" class="form-input" id="partCategory" placeholder="如：传动件">
        </div>
        <div class="form-group">
          <label class="form-label">规格</label>
          <input type="text" class="form-input" id="partSpec" placeholder="规格型号">
        </div>
        <div class="form-group">
          <label class="form-label">单位</label>
          <input type="text" class="form-input" id="partUnit" placeholder="如：个、件、套">
        </div>
        <div class="form-group">
          <label class="form-label">初始库存</label>
          <input type="number" class="form-input" id="partQty" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">最小库存</label>
          <input type="number" class="form-input" id="partMin" value="10">
        </div>
        <div class="form-group">
          <label class="form-label">最大库存</label>
          <input type="number" class="form-input" id="partMax" value="100">
        </div>
        <div class="form-group">
          <label class="form-label">单价 (元)</label>
          <input type="number" class="form-input" id="partPrice" value="0" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">存放位置</label>
          <input type="text" class="form-input" id="partLocation" placeholder="如：A区-01">
        </div>
        <div class="form-group">
          <label class="form-label">供应商</label>
          <input type="text" class="form-input" id="partSupplier" placeholder="供应商名称">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">描述</label>
        <textarea class="form-textarea" id="partDesc" placeholder="备件描述"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="savePart()">保存</button>
    </div>
  `;
  showModal(content);
}

async function savePart() {
  try {
    const data = {
      part_code: document.getElementById('partCode').value,
      name: document.getElementById('partName').value,
      category: document.getElementById('partCategory').value,
      specification: document.getElementById('partSpec').value,
      unit: document.getElementById('partUnit').value,
      quantity: parseInt(document.getElementById('partQty').value) || 0,
      min_stock: parseInt(document.getElementById('partMin').value) || 0,
      max_stock: parseInt(document.getElementById('partMax').value) || 0,
      unit_price: parseFloat(document.getElementById('partPrice').value) || 0,
      location: document.getElementById('partLocation').value,
      supplier: document.getElementById('partSupplier').value,
      description: document.getElementById('partDesc').value,
    };

    if (!data.part_code || !data.name) {
      showToast('请填写必填项', 'warning');
      return;
    }

    await API.inventory.create(data);
    showToast('备件创建成功', 'success');
    closeModal();
    loadSpareParts();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showPartDetail(id) {
  try {
    const part = await API.inventory.getById(id);

    const content = `
      <div class="modal-header">
        <div class="modal-title">备件详情 - ${part.name}</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">备件编号</span><span class="detail-value" style="font-family:monospace;">${part.part_code}</span></div>
          <div class="detail-item"><span class="detail-label">备件名称</span><span class="detail-value">${part.name}</span></div>
          <div class="detail-item"><span class="detail-label">类别</span><span class="detail-value">${part.category || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">规格</span><span class="detail-value">${part.specification || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">单位</span><span class="detail-value">${part.unit || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">库存数量</span><span class="detail-value">${part.quantity} <span class="status-badge stock-${part.stock_status}">${part.stock_status_text}</span></span></div>
          <div class="detail-item"><span class="detail-label">最小库存</span><span class="detail-value">${part.min_stock}</span></div>
          <div class="detail-item"><span class="detail-label">最大库存</span><span class="detail-value">${part.max_stock}</span></div>
          <div class="detail-item"><span class="detail-label">单价</span><span class="detail-value">¥${part.unit_price?.toFixed(2) || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">库存价值</span><span class="detail-value">¥${(part.quantity * part.unit_price).toFixed(2)}</span></div>
          <div class="detail-item"><span class="detail-label">存放位置</span><span class="detail-value">${part.location || '-'}</span></div>
          <div class="detail-item"><span class="detail-label">供应商</span><span class="detail-value">${part.supplier || '-'}</span></div>
        </div>
        <div class="divider"></div>
        <div class="detail-item">
          <span class="detail-label">描述</span>
          <span class="detail-value" style="font-weight:400;">${part.description || '暂无描述'}</span>
        </div>
        <div class="divider"></div>
        <div style="font-weight:600;margin-bottom:12px;">库存变动记录 (最近20条)</div>
        ${part.transactions?.length > 0 ? `
          <table class="data-table">
            <thead><tr><th>类型</th><th>数量</th><th>关联工单</th><th>操作人</th><th>时间</th></tr></thead>
            <tbody>
              ${part.transactions.slice(0, 20).map(t => `
                <tr>
                  <td>${t.transaction_type_text}</td>
                  <td>${t.quantity}</td>
                  <td>${t.order_no || '-'}</td>
                  <td>${t.operator || '-'}</td>
                  <td>${formatDateTime(t.transaction_date)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state" style="padding:20px;"><div>暂无库存变动记录</div></div>'}
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">关闭</button>
        <button class="btn btn-success" onclick="stockIn(${part.id});closeModal();">入库</button>
        <button class="btn btn-warning" onclick="stockOut(${part.id});closeModal();">出库</button>
      </div>
    `;
    showModal(content);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function stockIn(id) {
  const content = `
    <div class="modal-header">
      <div class="modal-title">备件入库</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">入库数量 *</label>
          <input type="number" class="form-input" id="stockQty" value="1" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">操作人</label>
          <input type="text" class="form-input" id="stockOperator" value="系统管理员">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">说明</label>
        <textarea class="form-textarea" id="stockDesc" placeholder="入库说明"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-success" onclick="submitStock(${id}, 'in')">确认入库</button>
    </div>
  `;
  showModal(content);
}

function stockOut(id) {
  const content = `
    <div class="modal-header">
      <div class="modal-title">备件出库</div>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">出库数量 *</label>
          <input type="number" class="form-input" id="stockQty" value="1" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">操作人</label>
          <input type="text" class="form-input" id="stockOperator" value="系统管理员">
        </div>
      </div>
      <div class="form-group mt-16">
        <label class="form-label">说明</label>
        <textarea class="form-textarea" id="stockDesc" placeholder="出库说明"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">取消</button>
      <button class="btn btn-warning" onclick="submitStock(${id}, 'out')">确认出库</button>
    </div>
  `;
  showModal(content);
}

async function submitStock(id, type) {
  try {
    const quantity = parseInt(document.getElementById('stockQty').value);
    const operator = document.getElementById('stockOperator').value;
    const description = document.getElementById('stockDesc').value;

    if (!quantity || quantity <= 0) {
      showToast('请输入有效数量', 'warning');
      return;
    }

    await API.inventory.updateStock(id, {
      transaction_type: type,
      quantity,
      operator,
      description,
    });

    showToast(type === 'in' ? '入库成功' : '出库成功', 'success');
    closeModal();
    loadSpareParts();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showPurchaseSuggestion() {
  try {
    const result = await API.inventory.getPurchaseSuggestion();

    const content = `
      <div class="modal-header">
        <div class="modal-title">智能采购建议</div>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display:flex;gap:20px;margin-bottom:20px;">
          <div style="flex:1;padding:16px;background:#f6ffed;border-radius:8px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#52c41a;">${result.total_parts}</div>
            <div style="font-size:13px;color:#8c8c8c;">需采购备件数</div>
          </div>
          <div style="flex:1;padding:16px;background:#fff7e6;border-radius:8px;text-align:center;">
            <div style="font-size:24px;font-weight:700;color:#fa8c16;">¥${formatNumber(result.total_estimated_cost)}</div>
            <div style="font-size:13px;color:#8c8c8c;">预估总费用</div>
          </div>
        </div>
        
        ${result.suggestions.length > 0 ? `
          <table class="data-table">
            <thead><tr><th>备件名称</th><th>当前库存</th><th>建议采购</th><th>单价</th><th>预估费用</th><th>紧急程度</th></tr></thead>
            <tbody>
              ${result.suggestions.map(s => `
                <tr>
                  <td>${s.part_name}</td>
                  <td>${s.current_quantity}</td>
                  <td style="font-weight:600;color:#fa8c16;">${s.suggested_quantity}</td>
                  <td>¥${s.unit_price?.toFixed(2) || '-'}</td>
                  <td>¥${s.estimated_cost.toFixed(2)}</td>
                  <td><span class="status-badge priority-${s.urgency === 'urgent' ? 'urgent' : s.urgency === 'high' ? 'high' : 'normal'}">${s.urgency_text}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="empty-state"><div class="empty-state-icon">✅</div><div>库存充足，无需采购</div></div>'}
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">关闭</button>
      </div>
    `;
    showModal(content);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadHealthPage() {
  try {
    const report = await API.health.getReport();
    renderHealthStats(report);
    renderHealthTable(report);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderHealthStats(report) {
  const container = document.getElementById('healthStats');
  
  const dist = report.health_distribution;
  const stats = [
    { label: '健康度优秀', value: dist.excellent || 0, color: 'green', icon: '✅' },
    { label: '健康度良好', value: dist.good || 0, color: 'blue', icon: '👍' },
    { label: '健康度一般', value: dist.fair || 0, color: 'orange', icon: '⚠️' },
    { label: '健康度较差', value: dist.poor || 0, color: 'orange', icon: '🔧' },
    { label: '健康度严重', value: dist.critical || 0, color: 'red', icon: '🚨' },
  ];

  container.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-header">
        <span class="stat-label">${s.label}</span>
        <span class="stat-icon ${s.color}">${s.icon}</span>
      </div>
      <div class="stat-value">${s.value} 台</div>
    </div>
  `).join('');
}

function renderHealthTable(report) {
  const tbody = document.getElementById('healthTableBody');

  const rows = [];
  for (const cat of report.category_health || []) {
    rows.push({
      name: `【${cat.category}】分类平均`,
      code: '-',
      health_score: cat.avg_score,
      status: '-',
      risk: cat.assessment?.level === 'excellent' || cat.assessment?.level === 'good' ? 'none' : (cat.assessment?.level === 'fair' ? 'medium' : 'high'),
      check_time: '-',
      isCategory: true,
    });
  }

  const atRiskList = report.at_risk_equipment || [];
  for (const e of atRiskList.slice(0, 10)) {
    rows.push({
      name: e.name,
      code: e.equipment_code,
      health_score: e.health_score,
      status: e.status,
      risk: e.health_score < 40 ? 'critical' : (e.health_score < 60 ? 'high' : (e.health_score < 75 ? 'medium' : 'low')),
      check_time: '-',
      isCategory: false,
      id: e.id,
    });
  }

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state" style="padding:40px;"><div class="empty-state-icon">❤️</div><div>暂无健康数据</div></div></td></tr>';
    return;
  }

  const statusMap = { running: '运行中', maintenance: '维保中', fault: '故障', idle: '闲置', installed: '已安装', purchased: '已采购', scrapped: '已报废' };
  const riskMap = { 
    critical: { text: '严重风险', class: 'health-critical' },
    high: { text: '高风险', class: 'health-poor' },
    medium: { text: '中等风险', class: 'health-fair' },
    low: { text: '低风险', class: 'health-good' },
    none: { text: '无风险', class: 'health-excellent' },
  };

  tbody.innerHTML = rows.map(r => `
    <tr ${r.isCategory ? 'style="background:#fafafa;"' : ''}>
      <td style="font-weight:${r.isCategory ? '600' : '500'};">${r.name}</td>
      <td>${r.code}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="progress-bar" style="width:100px;">
            <div class="progress-fill ${r.health_score >= 80 ? 'success' : r.health_score >= 60 ? 'warning' : 'danger'}" style="width:${r.health_score}%"></div>
          </div>
          <span style="font-weight:600;">${r.health_score}%</span>
        </div>
      </td>
      <td>${statusMap[r.status] || r.status}</td>
      <td><span class="status-badge ${riskMap[r.risk].class}">${riskMap[r.risk].text}</span></td>
      <td>${r.check_time}</td>
      <td>
        ${!r.isCategory && r.id ? `
          <div class="btn-group">
            <button class="btn btn-sm btn-primary" onclick="checkEquipmentHealth(${r.id})">健康检查</button>
            <button class="btn btn-sm btn-success" onclick="showEquipmentHealthDetail(${r.id})">详情</button>
          </div>
        ` : '-'}
      </td>
    </tr>
  `).join('');
}

async function checkEquipmentHealth(id) {
  try {
    await API.health.triggerCheck(id);
    showToast('健康检查已触发，请稍后查看结果', 'success');
    if (currentPage === 'health') {
      setTimeout(loadHealthPage, 2000);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function showEquipmentHealthDetail(id) {
  try {
    const result = await API.health.getEquipmentHealth(id);
    showEquipmentDetail(id);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function batchHealthCheck() {
  try {
    showToast('正在启动批量健康检查...', 'info');
    const result = await API.health.batchCheck();
    showToast(`批量健康检查已启动，共 ${result.count || 0} 台设备正在检查中`, 'success');
    
    if (currentPage === 'dashboard') {
      setTimeout(loadDashboard, 3000);
    } else if (currentPage === 'health') {
      setTimeout(loadHealthPage, 3000);
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function generateAutoPlans() {
  try {
    showToast('正在自动生成维保计划...', 'info');
    const result = await API.maintenance.generateAuto();
    showToast(`生成完成，共创建 ${result.created_count || 0} 个维保计划`, 'success');
    
    if (currentPage === 'maintenance') {
      loadMaintenancePlans();
    } else if (currentPage === 'dashboard') {
      loadDashboard();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadSystemPage() {
  try {
    const [info, ports, queueStats] = await Promise.all([
      API.system.getInfo(),
      API.system.getPorts(),
      API.system.getQueueStats(),
    ]);

    renderSystemInfo(info);
    renderPortList(ports);
    renderQueueStats(queueStats);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderSystemInfo(info) {
  const container = document.getElementById('systemInfo');

  const items = [
    { label: '系统名称', value: info.name },
    { label: '系统版本', value: info.version },
    { label: '运行环境', value: `${info.tech_stack?.backend || 'Fastify'} + ${info.tech_stack?.database || 'SQLite'}` },
    { label: '消息队列', value: info.tech_stack?.queue || 'BullMQ' },
    { label: '监控系统', value: info.tech_stack?.monitoring || 'Sentry' },
    { label: '服务端口', value: '3000' },
    { label: '服务状态', value: '✅ 运行正常' },
    { label: '服务器时间', value: formatDateTime(info.server_time) },
    { label: '运行时长', value: formatUptime(info.uptime || 0) },
  ];

  container.innerHTML = items.map(i => `
    <div class="detail-item">
      <span class="detail-label">${i.label}</span>
      <span class="detail-value">${i.value}</span>
    </div>
  `).join('');
}

function renderPortList(ports) {
  const tbody = document.getElementById('portList');
  
  const rows = [
    { name: 'HTTP 服务', port: ports.http_server, desc: ports.description?.http_server || '' },
    { name: 'Redis 服务', port: ports.redis, desc: ports.description?.redis || '' },
  ];

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="font-weight:500;">${r.name}</td>
      <td><code style="background:#f0f0f0;padding:4px 8px;border-radius:4px;">${r.port}</code></td>
      <td>${r.desc}</td>
    </tr>
  `).join('');
}

function renderQueueStats(stats) {
  const container = document.getElementById('queueStats');

  const queueNames = {
    maintenance: '维保计划队列',
    work_orders: '工单处理队列',
    health_check: '健康检查队列',
    inventory_alerts: '库存预警队列',
  };

  const html = Object.entries(stats).map(([key, value]) => `
    <div style="background:#fafafa;padding:16px;border-radius:8px;">
      <div style="font-weight:600;margin-bottom:12px;">${queueNames[key] || key}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">
        <div>
          <div style="font-size:12px;color:#8c8c8c;">等待中</div>
          <div style="font-size:20px;font-weight:700;color:#faad14;">${value.waiting || 0}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#8c8c8c;">处理中</div>
          <div style="font-size:20px;font-weight:700;color:#1890ff;">${value.active || 0}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#8c8c8c;">已完成</div>
          <div style="font-size:20px;font-weight:700;color:#52c41a;">${value.completed || 0}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#8c8c8c;">失败</div>
          <div style="font-size:20px;font-weight:700;color:#f5222d;">${value.failed || 0}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#8c8c8c;">延时任务</div>
          <div style="font-size:20px;font-weight:700;color:#722ed1;">${value.delayed || 0}</div>
        </div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `<div style="display:grid;gap:16px;">${html}</div>`;
}

function testSentryError() {
  if (!confirm('确定要测试错误监控系统吗？这将故意抛出一个错误以测试Sentry捕获。')) return;
  
  showToast('正在触发测试错误...', 'info');
  
  setTimeout(() => {
    fetch('/api/system/test-error', { method: 'POST' })
      .then(r => r.json())
      .then(() => {
        showToast('测试错误已触发，Sentry已捕获', 'success');
      })
      .catch(() => {
        showToast('测试完成，请查看Sentry控制台', 'info');
      });
  }, 500);
}
