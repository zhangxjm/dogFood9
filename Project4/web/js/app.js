class App {
  constructor() {
    this.currentPage = 'dashboard';
    this.state = {
      buildings: [],
      monitorStatus: null,
      fireEvents: [],
      personnel: [],
      rescuePlans: [],
      rescueUnits: [],
      commands: [],
      resources: [],
      traces: []
    };
    this.timers = [];
    this.threeScene = null;
    this.setupNavigation();
  }

  init() {
    this.setupEventListeners();
    this.navigate('dashboard');
    this.startClock();
  }

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.navigate(page);
      });
    });
  }

  setupEventListeners() {
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) this.hideModal();
      });
    }
  }

  navigate(page) {
    this.currentPage = page;
    this.clearTimers();
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === `page-${page}`);
    });
    this.loadPage(page);
  }

  clearTimers() {
    this.timers.forEach(t => clearInterval(t));
    this.timers = [];
  }

  startClock() {
    const update = () => {
      const now = new Date();
      const el = document.getElementById('system-time');
      if (el) el.textContent = now.toLocaleString('zh-CN', { hour12: false });
    };
    update();
    setInterval(update, 1000);
  }

  async loadPage(page) {
    switch (page) {
      case 'dashboard': await this.loadDashboard(); break;
      case 'building3d': this.loadBuilding3D(); break;
      case 'firemap': await this.loadFireMap(); break;
      case 'personnel': await this.loadPersonnel(); break;
      case 'rescue': await this.loadRescue(); break;
      case 'command': await this.loadCommand(); break;
      case 'resource': await this.loadResource(); break;
      case 'monitor': await this.loadMonitor(); break;
    }
  }

  async apiGet(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('API GET error:', path, e);
      return null;
    }
  }

  async apiPost(path, body) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('API POST error:', path, e);
      return null;
    }
  }

  async apiPut(path, body) {
    try {
      const res = await fetch(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('API PUT error:', path, e);
      return null;
    }
  }

  showModal(title, contentHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHtml;
    document.getElementById('modal-overlay').classList.add('show');
  }

  hideModal() {
    document.getElementById('modal-overlay').classList.remove('show');
  }

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { hour12: false });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async loadDashboard() {
    const container = document.getElementById('page-dashboard');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    const [status, buildings, fireData] = await Promise.all([
      this.apiGet('/api/v1/monitor/status'),
      this.apiGet('/api/v1/buildings'),
      this.apiGet('/api/v1/buildings/1/fire-situation')
    ]);

    if (status) this.state.monitorStatus = status;
    if (buildings) this.state.buildings = buildings.buildings || buildings || [];
    if (fireData) this.state.fireEvents = fireData.fire_zones || fireData.fire_events || fireData.zones || (Array.isArray(fireData) ? fireData : []);

    this.renderDashboard();

    this.timers.push(setInterval(() => this.loadDashboard(), 5000));
  }

  renderDashboard() {
    const container = document.getElementById('page-dashboard');
    const s = this.state.monitorStatus || {};
    const fireCount = this.state.fireEvents.length;
    const buildingCount = this.state.buildings.length;

    let fireAlertsHtml = '';
    if (this.state.fireEvents.length === 0) {
      fireAlertsHtml = '<div class="empty-state"><div class="empty-icon">🔥</div><p>暂无火情信息</p></div>';
    } else {
      this.state.fireEvents.forEach(ev => {
        const severity = ev.severity || ev.level || 'medium';
        const location = ev.location || ev.zone_name || ev.name || '-';
        const temp = ev.temperature || ev.temp || '-';
        fireAlertsHtml += `
          <div class="fire-event-card severity-${severity}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span class="badge badge-${severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'info'}">${severity === 'high' ? '高危' : severity === 'medium' ? '中等' : '低危'}</span>
              <span style="font-size:12px;color:var(--text-muted)">${this.formatDate(ev.updated_at || ev.created_at)}</span>
            </div>
            <div class="fire-detail-row"><span class="detail-label">位置</span><span class="detail-value">${location}</span></div>
            <div class="fire-detail-row"><span class="detail-label">温度</span><span class="detail-value">${temp}℃</span></div>
            <div class="fire-detail-row"><span class="detail-label">蔓延速率</span><span class="detail-value">${ev.spread_rate || '-'}</span></div>
          </div>`;
      });
    }

    let buildingListHtml = '';
    if (this.state.buildings.length === 0) {
      buildingListHtml = '<div class="empty-state"><p>暂无建筑数据</p></div>';
    } else {
      this.state.buildings.forEach(b => {
        buildingListHtml += `
          <div class="card" style="margin-bottom:8px;padding:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600">${b.name || b.building_name || '建筑'}</span>
              <span class="badge badge-${b.status === 'danger' ? 'danger' : b.status === 'warning' ? 'warning' : 'success'}">${b.status === 'danger' ? '危险' : b.status === 'warning' ? '警告' : '正常'}</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${b.address || b.floors ? (b.floors + '层') : ''}</div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="dashboard-grid" style="margin-bottom:20px">
        <div class="stat-card stat-danger">
          <div class="stat-label">活跃火情</div>
          <div class="stat-value">${s.active_fires ?? fireCount}</div>
          <div class="stat-change">实时监测</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-label">监控建筑</div>
          <div class="stat-value">${s.monitored_buildings ?? buildingCount}</div>
          <div class="stat-change">全部接入</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-label">被困人员</div>
          <div class="stat-value">${s.trapped_personnel ?? 0}</div>
          <div class="stat-change">待救援</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-label">已救出</div>
          <div class="stat-value">${s.rescued_personnel ?? 0}</div>
          <div class="stat-change">安全撤离</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-label">救援队伍</div>
          <div class="stat-value">${s.active_units ?? 0}</div>
          <div class="stat-change">执行中</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-label">系统运行时间</div>
          <div class="stat-value">${s.uptime ?? '-'}</div>
          <div class="stat-change">稳定运行</div>
        </div>
      </div>
      <div class="two-column">
        <div>
          <h3 class="section-title">🔥 火情预警</h3>
          ${fireAlertsHtml}
        </div>
        <div>
          <h3 class="section-title">🏢 建筑列表</h3>
          ${buildingListHtml}
        </div>
      </div>`;
  }

  loadBuilding3D() {
    const container = document.getElementById('page-building3d');
    container.innerHTML = `
      <div class="viewer-container" id="three-container">
        <div class="floor-selector" id="floor-selector">
          <h4>楼层选择</h4>
          <button class="floor-btn active" data-floor="-1">全部楼层</button>
        </div>
        <div class="viewer-legend">
          <h4>图例</h4>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#4caf50"></span>安全区域</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#ff4444"></span>火灾区域</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#ff8800"></span>警戒区域</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#2196f3"></span>水源位置</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#00bcd4"></span>救援通道</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#9c27b0"></span>被困人员</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#4caf50;border-radius:50%"></span>移动人员</div>
          <div class="viewer-legend-item"><span class="legend-color" style="background:#2196f3;border-radius:50%"></span>已救出</div>
        </div>
      </div>`;

    this.initThreeScene();
  }

  initThreeScene() {
    if (typeof THREE === 'undefined') {
      document.getElementById('three-container').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Three.js 加载失败，请检查网络连接</p></div>';
      return;
    }

    const container = document.getElementById('three-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.Fog(0x0a0e17, 30, 80);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    let orbitControls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.05;
      orbitControls.target.set(0, 3, 0);
    }

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(30, 30, 0x2a3040, 0x1a1f2e);
    scene.add(gridHelper);

    const floorGroups = [];
    const floorHeight = 2.5;
    const buildingWidth = 8;
    const buildingDepth = 6;

    for (let i = 0; i < 6; i++) {
      const group = new THREE.Group();
      group.position.y = i * floorHeight;

      const floorGeo = new THREE.BoxGeometry(buildingWidth, 0.1, buildingDepth);
      const floorMat = new THREE.MeshPhongMaterial({
        color: 0x1a1f2e,
        transparent: true,
        opacity: 0.6
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.y = 0;
      group.add(floor);

      const wireGeo = new THREE.BoxGeometry(buildingWidth, floorHeight * 0.9, buildingDepth);
      const wireEdges = new THREE.EdgesGeometry(wireGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x2a3040, transparent: true, opacity: 0.5 });
      const wireframe = new THREE.LineSegments(wireEdges, wireMat);
      wireframe.position.y = floorHeight * 0.45;
      group.add(wireframe);

      const roomCols = 3;
      const roomRows = 2;
      const roomW = buildingWidth / roomCols;
      const roomD = buildingDepth / roomRows;

      for (let r = 0; r < roomRows; r++) {
        for (let c = 0; c < roomCols; c++) {
          let roomColor = 0x4caf50;
          let roomOpacity = 0.15;
          if (i === 2 && r === 1 && c === 1) { roomColor = 0xff4444; roomOpacity = 0.35; }
          else if (i === 3 && r === 0 && c === 2) { roomColor = 0xff8800; roomOpacity = 0.25; }
          else if (i === 0 && r === 0 && c === 0) { roomColor = 0x2196f3; roomOpacity = 0.25; }

          const roomGeo = new THREE.BoxGeometry(roomW * 0.9, floorHeight * 0.7, roomD * 0.9);
          const roomMat = new THREE.MeshPhongMaterial({
            color: roomColor,
            transparent: true,
            opacity: roomOpacity,
            side: THREE.DoubleSide
          });
          const room = new THREE.Mesh(roomGeo, roomMat);
          room.position.set(
            -buildingWidth / 2 + roomW * (c + 0.5),
            floorHeight * 0.4,
            -buildingDepth / 2 + roomD * (r + 0.5)
          );
          group.add(room);
        }
      }

      scene.add(group);
      floorGroups.push(group);
    }

    const fireParticles = [];
    const firePositions = [
      { x: 0, y: 2 * floorHeight + 1, z: 0 },
      { x: 1, y: 2 * floorHeight + 0.5, z: -0.5 }
    ];
    firePositions.forEach(pos => {
      const particleCount = 60;
      const positions = new Float32Array(particleCount * 3);
      for (let j = 0; j < particleCount; j++) {
        positions[j * 3] = (Math.random() - 0.5) * 2 + pos.x;
        positions[j * 3 + 1] = Math.random() * 2 + pos.y;
        positions[j * 3 + 2] = (Math.random() - 0.5) * 2 + pos.z;
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0xff4444,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
      fireParticles.push(particles);
    });

    const personnelData = [
      { x: -2, y: 1 * floorHeight + 1, z: 1, status: 'trapped' },
      { x: 1, y: 3 * floorHeight + 1, z: -1, status: 'trapped' },
      { x: 3, y: 0 * floorHeight + 1, z: 2, status: 'moving' },
      { x: -3, y: 1 * floorHeight + 1, z: -2, status: 'rescued' }
    ];
    const personnelMeshes = [];
    personnelData.forEach(p => {
      const color = p.status === 'trapped' ? 0xff4444 : p.status === 'moving' ? 0x4caf50 : 0x2196f3;
      const sphereGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const sphereMat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(p.x, p.y, p.z);
      scene.add(sphere);
      personnelMeshes.push(sphere);
    });

    const waterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const waterMat = new THREE.MeshPhongMaterial({ color: 0x2196f3, transparent: true, opacity: 0.7 });
    const waterSource = new THREE.Mesh(waterGeo, waterMat);
    waterSource.position.set(-buildingWidth / 2 - 2, 0.4, 0);
    scene.add(waterSource);

    const passagePoints = [
      new THREE.Vector3(-buildingWidth / 2 - 2, 0.1, 0),
      new THREE.Vector3(-buildingWidth / 2, 0.1, 0),
      new THREE.Vector3(-buildingWidth / 2, 0.1 + floorHeight, 0),
      new THREE.Vector3(-2, 0.1 + floorHeight, 1)
    ];
    const passageGeo = new THREE.BufferGeometry().setFromPoints(passagePoints);
    const passageMat = new THREE.LineBasicMaterial({ color: 0x00bcd4, linewidth: 2 });
    const passage = new THREE.Line(passageGeo, passageMat);
    scene.add(passage);

    const floorSelector = document.getElementById('floor-selector');
    for (let i = 0; i < 6; i++) {
      const btn = document.createElement('button');
      btn.className = 'floor-btn';
      btn.dataset.floor = i;
      btn.textContent = `${i + 1}层`;
      floorSelector.appendChild(btn);
    }

    floorSelector.addEventListener('click', (e) => {
      if (!e.target.classList.contains('floor-btn')) return;
      floorSelector.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const floor = parseInt(e.target.dataset.floor);
      floorGroups.forEach((g, idx) => {
        g.visible = floor === -1 || idx === floor;
      });
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    container.addEventListener('click', (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(personnelMeshes);
      if (intersects.length > 0) {
        const idx = personnelMeshes.indexOf(intersects[0].object);
        if (idx >= 0) {
          const p = personnelData[idx];
          const statusText = p.status === 'trapped' ? '被困' : p.status === 'moving' ? '移动中' : '已救出';
          this.showModal('人员详情', `
            <div class="form-group"><label>状态</label><span class="badge badge-${p.status === 'trapped' ? 'danger' : p.status === 'moving' ? 'success' : 'info'}">${statusText}</span></div>
            <div class="form-group"><label>位置</label><p>X: ${p.x.toFixed(1)}, Y: ${p.y.toFixed(1)}, Z: ${p.z.toFixed(1)}</p></div>
            <div class="form-group"><label>楼层</label><p>${Math.floor(p.y / floorHeight) + 1}层</p></div>
          `);
        }
      }
    });

    const animate = () => {
      requestAnimationFrame(animate);
      if (orbitControls) orbitControls.update();

      fireParticles.forEach(p => {
        const positions = p.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += 0.02;
          if (positions[i] > 8) positions[i] = Math.random() * 2;
        }
        p.geometry.attributes.position.needsUpdate = true;
      });

      personnelMeshes.forEach((m, idx) => {
        if (personnelData[idx].status === 'moving') {
          m.position.x += Math.sin(Date.now() * 0.002 + idx) * 0.01;
          m.position.z += Math.cos(Date.now() * 0.002 + idx) * 0.01;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    this.threeScene = { scene, camera, renderer, orbitControls };
  }

  async loadFireMap() {
    const container = document.getElementById('page-firemap');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    let allEvents = [];
    const buildings = this.state.buildings.length > 0 ? this.state.buildings : [{ id: 1, name: '建筑1' }];

    for (const b of buildings) {
      const data = await this.apiGet(`/api/v1/buildings/${b.id}/fire-situation`);
      if (data) {
        const events = data.fire_zones || data.fire_events || data.zones || (Array.isArray(data) ? data : []);
        events.forEach(e => { e.building_name = e.building_name || b.name; });
        allEvents = allEvents.concat(events);
      }
    }

    this.state.fireEvents = allEvents;
    this.renderFireMap();
    this.timers.push(setInterval(() => this.loadFireMap(), 10000));
  }

  renderFireMap() {
    const container = document.getElementById('page-firemap');

    let cardsHtml = '';
    if (this.state.fireEvents.length === 0) {
      cardsHtml = '<div class="empty-state"><div class="empty-icon">🔥</div><p>暂无火情数据</p></div>';
    } else {
      this.state.fireEvents.forEach(ev => {
        const severity = ev.severity || ev.level || 'medium';
        const location = ev.location || ev.zone_name || ev.name || '-';
        const temp = ev.temperature || ev.temp || '-';
        const spread = ev.spread_rate || '-';
        const threatLevel = ev.threat_level || severity;
        const threatPct = threatLevel === 'high' ? 85 : threatLevel === 'medium' ? 50 : 20;
        const actions = ev.recommended_actions || ev.actions || ['启动灭火系统', '疏散人员', '通知消防队'];

        let actionsHtml = '';
        if (Array.isArray(actions)) {
          actions.forEach(a => { actionsHtml += `<li>${a}</li>`; });
        }

        cardsHtml += `
          <div class="fire-event-card severity-${severity}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-weight:600;font-size:15px">${location}</span>
              <span class="badge badge-${severity === 'high' ? 'danger' : severity === 'medium' ? 'warning' : 'success'} alert-pulse">${severity === 'high' ? '高危' : severity === 'medium' ? '中等' : '低危'}</span>
            </div>
            <div class="fire-detail-row"><span class="detail-label">建筑</span><span class="detail-value">${ev.building_name || '-'}</span></div>
            <div class="fire-detail-row"><span class="detail-label">温度</span><span class="detail-value">${temp}℃</span></div>
            <div class="fire-detail-row"><span class="detail-label">蔓延速率</span><span class="detail-value">${spread}</span></div>
            <div class="threat-indicator">
              <span style="font-size:12px;color:var(--text-secondary)">威胁等级</span>
              <div class="threat-bar"><div class="threat-bar-fill threat-${threatLevel}" style="width:${threatPct}%"></div></div>
              <span style="font-size:12px">${threatPct}%</span>
            </div>
            <div style="margin-top:8px">
              <span style="font-size:13px;color:var(--text-secondary)">建议措施:</span>
              <ul class="action-list">${actionsHtml}</ul>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 class="section-title" style="margin-bottom:0;border-bottom:none">🔥 火场态势</h3>
        <button class="btn btn-danger" onclick="app.showReportFireModal()">报告火情</button>
      </div>
      ${cardsHtml}`;
  }

  showReportFireModal() {
    let buildingOptions = '';
    this.state.buildings.forEach(b => {
      buildingOptions += `<option value="${b.id}">${b.name || b.building_name}</option>`;
    });
    if (!buildingOptions) buildingOptions = '<option value="1">建筑1</option>';

    this.showModal('报告火情', `
      <form id="fire-report-form">
        <div class="form-group">
          <label>建筑</label>
          <select class="form-select" name="building_id">${buildingOptions}</select>
        </div>
        <div class="form-group">
          <label>楼层</label>
          <input class="form-input" name="floor" placeholder="例如: 3F" required>
        </div>
        <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div>
            <label>位置X</label>
            <input class="form-input" name="location_x" type="number" step="0.1" placeholder="X坐标" value="0">
          </div>
          <div>
            <label>位置Y</label>
            <input class="form-input" name="location_y" type="number" step="0.1" placeholder="Y坐标" value="0">
          </div>
          <div>
            <label>位置Z</label>
            <input class="form-input" name="location_z" type="number" step="0.1" placeholder="Z坐标" value="0">
          </div>
        </div>
        <div class="form-group">
          <label>严重程度</label>
          <select class="form-select" name="severity">
            <option value="低">低危</option>
            <option value="中" selected>中等</option>
            <option value="高">高危</option>
            <option value="极高">极高</option>
          </select>
        </div>
        <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label>温度(℃)</label>
            <input class="form-input" name="temperature" type="number" placeholder="请输入温度" value="200">
          </div>
          <div>
            <label>蔓延速率</label>
            <input class="form-input" name="spread_rate" type="number" step="0.1" placeholder="蔓延速度" value="0.5">
          </div>
        </div>
        <div style="text-align:right">
          <button type="submit" class="btn btn-danger">提交报告</button>
        </div>
      </form>
    `);

    document.getElementById('fire-report-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        building_id: parseInt(form.building_id.value),
        location_x: parseFloat(form.location_x.value) || 0,
        location_y: parseFloat(form.location_y.value) || 0,
        location_z: parseFloat(form.location_z.value) || 0,
        floor: form.floor.value,
        severity: form.severity.value,
        temperature: parseFloat(form.temperature.value) || 0,
        spread_rate: parseFloat(form.spread_rate.value) || 0,
        status: '蔓延中'
      };
      const result = await this.apiPost('/api/v1/fire-events', data);
      if (result) {
        this.showToast('火情报告已提交', 'success');
        this.hideModal();
        this.loadFireMap();
      } else {
        this.showToast('提交失败，请重试', 'error');
      }
    });
  }

  async loadPersonnel() {
    const container = document.getElementById('page-personnel');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    let allPersonnel = [];
    const buildings = this.state.buildings.length > 0 ? this.state.buildings : [{ id: 1, name: '建筑1' }];

    for (const b of buildings) {
      const data = await this.apiGet(`/api/v1/buildings/${b.id}/personnel`);
      if (data) {
        const persons = data.personnel || (Array.isArray(data) ? data : []);
        persons.forEach(p => { p.building_name = p.building_name || b.name; });
        allPersonnel = allPersonnel.concat(persons);
      }
    }

    this.state.personnel = allPersonnel;
    this.renderPersonnel();
    this.timers.push(setInterval(() => this.simulatePersonnelUpdate(), 3000));
  }

  simulatePersonnelUpdate() {
    this.state.personnel.forEach(p => {
      if (p.status === 'trapped' && Math.random() > 0.7) {
        p.status = 'located';
      } else if (p.status === 'located' && Math.random() > 0.8) {
        p.status = 'evacuating';
      } else if (p.status === 'evacuating' && Math.random() > 0.7) {
        p.status = 'rescued';
      }
      if (p.floor && p.location_x !== undefined) {
        p.location_x += (Math.random() - 0.5) * 0.5;
        p.location_y += (Math.random() - 0.5) * 0.3;
      }
    });
    this.renderPersonnel();
  }

  renderPersonnel() {
    const container = document.getElementById('page-personnel');
    const persons = this.state.personnel;

    const trapped = persons.filter(p => p.status === 'trapped').length;
    const located = persons.filter(p => p.status === 'located').length;
    const evacuating = persons.filter(p => p.status === 'evacuating').length;
    const rescued = persons.filter(p => p.status === 'rescued').length;

    let cardsHtml = '';
    if (persons.length === 0) {
      cardsHtml = '<div class="empty-state"><div class="empty-icon">👥</div><p>暂无人员数据</p></div>';
    } else {
      persons.forEach((p, idx) => {
        const statusMap = {
          'trapped': { text: '被困', badge: 'danger' },
          'located': { text: '已定位', badge: 'warning' },
          'evacuating': { text: '转移中', badge: 'info' },
          'rescued': { text: '已救出', badge: 'success' }
        };
        const st = statusMap[p.status] || statusMap['located'];

        cardsHtml += `
          <div class="personnel-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="person-name">${p.name || '人员' + (idx + 1)}</span>
              <span class="badge badge-${st.badge}">${st.text}</span>
            </div>
            <div class="person-info">📍 ${p.location || p.floor ? (p.floor + '层') : '未知位置'}</div>
            <div class="person-info">🏢 ${p.building_name || '-'}</div>
            <div class="person-actions">
              <button class="btn btn-sm btn-primary" onclick="app.showUpdateLocationModal(${idx})">更新位置</button>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-count" style="color:var(--accent-red)">${trapped}</span>
          <span class="summary-label">被困</span>
        </div>
        <div class="summary-item">
          <span class="summary-count" style="color:var(--accent-orange)">${located}</span>
          <span class="summary-label">已定位</span>
        </div>
        <div class="summary-item">
          <span class="summary-count" style="color:var(--accent-blue)">${evacuating}</span>
          <span class="summary-label">转移中</span>
        </div>
        <div class="summary-item">
          <span class="summary-count" style="color:var(--accent-green)">${rescued}</span>
          <span class="summary-label">已救出</span>
        </div>
      </div>
      <div class="dashboard-grid">${cardsHtml}</div>`;
  }

  showUpdateLocationModal(idx) {
    const p = this.state.personnel[idx];
    if (!p) return;
    this.showModal('更新位置', `
      <form id="location-update-form">
        <div class="form-group">
          <label>人员名称</label>
          <input class="form-input" value="${p.name || ''}" disabled>
        </div>
        <div class="form-group">
          <label>楼层</label>
          <input class="form-input" name="floor" type="number" value="${p.floor || 1}" min="1" max="20">
        </div>
        <div class="form-group">
          <label>位置描述</label>
          <input class="form-input" name="location" value="${p.location || ''}">
        </div>
        <div style="text-align:right">
          <button type="submit" class="btn btn-primary">更新</button>
        </div>
      </form>
    `);

    document.getElementById('location-update-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      p.floor = parseInt(form.floor.value);
      p.location = form.location.value;
      this.showToast('位置已更新', 'success');
      this.hideModal();
      this.renderPersonnel();
    });
  }

  async loadRescue() {
    const container = document.getElementById('page-rescue');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    const buildings = this.state.buildings.length > 0 ? this.state.buildings : [{ id: 1, name: '建筑1' }];
    let allPlans = [];
    for (const b of buildings) {
      const data = await this.apiGet(`/api/v1/buildings/${b.id}/rescue-plans`);
      if (data) {
        const plans = data.plans || (Array.isArray(data) ? data : []);
        plans.forEach(p => { p.building_name = p.building_name || b.name; });
        allPlans = allPlans.concat(plans);
      }
    }
    this.state.rescuePlans = allPlans;

    const units = await this.apiGet('/api/v1/rescue-units');
    if (units) this.state.rescueUnits = units.units || (Array.isArray(units) ? units : []);

    this.renderRescue();
  }

  renderRescue() {
    const container = document.getElementById('page-rescue');

    let plansHtml = '';
    if (this.state.rescuePlans.length === 0) {
      plansHtml = '<div class="empty-state"><div class="empty-icon">🎯</div><p>暂无救援方案</p></div>';
    } else {
      this.state.rescuePlans.forEach((plan, idx) => {
        const statusMap = {
          'pending': { text: '待执行', badge: 'warning' },
          'executing': { text: '执行中', badge: 'info' },
          'completed': { text: '已完成', badge: 'success' },
          'failed': { text: '失败', badge: 'danger' }
        };
        const st = statusMap[plan.status] || statusMap['pending'];

        plansHtml += `
          <div class="rescue-plan-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <span style="font-weight:600;font-size:15px">${plan.name || '方案' + (idx + 1)}</span>
              <span class="badge badge-${st.badge}">${st.text}</span>
            </div>
            <div class="fire-detail-row"><span class="detail-label">策略</span><span class="detail-value">${plan.strategy || '-'}</span></div>
            <div class="fire-detail-row"><span class="detail-label">预计时间</span><span class="detail-value">${plan.estimated_time || plan.estimated_duration || '-'}</span></div>
            <div class="fire-detail-row"><span class="detail-label">建筑</span><span class="detail-value">${plan.building_name || '-'}</span></div>
            <div style="margin-top:10px;display:flex;gap:8px">
              <button class="btn btn-sm btn-primary" onclick="app.simulatePlan(${idx})">模拟推演</button>
            </div>
            <div id="simulation-result-${idx}" style="margin-top:10px"></div>
          </div>`;
      });
    }

    let unitsOptions = '';
    this.state.rescueUnits.forEach(u => {
      unitsOptions += `<option value="${u.id || u.unit_id}">${u.name || u.unit_name || '单位'}</option>`;
    });

    container.innerHTML = `
      <div class="two-column">
        <div>
          <h3 class="section-title">🎯 救援方案</h3>
          ${plansHtml}
        </div>
        <div>
          <h3 class="section-title">🚒 调度兵力</h3>
          <div class="card">
            <form id="schedule-force-form">
              <div class="form-group">
                <label>选择单位</label>
                <select class="form-select" name="unit_id" multiple style="height:100px">
                  ${unitsOptions || '<option value="1">消防一中队</option><option value="2">消防二中队</option>'}
                </select>
              </div>
              <div class="form-group">
                <label>策略</label>
                <select class="form-select" name="strategy">
                  <option value="interior">内攻救援</option>
                  <option value="exterior">外攻救援</option>
                  <option value="combined">内外结合</option>
                  <option value="evacuation">疏散撤离</option>
                </select>
              </div>
              <div class="form-group">
                <label>目标建筑</label>
                <select class="form-select" name="building_id">
                  ${this.state.buildings.map(b => `<option value="${b.id}">${b.name || b.building_name}</option>`).join('') || '<option value="1">建筑1</option>'}
                </select>
              </div>
              <button type="submit" class="btn btn-success">调度</button>
            </form>
          </div>
          <h3 class="section-title" style="margin-top:20px">📋 可用救援单位</h3>
          ${this.state.rescueUnits.length === 0 ? '<div class="empty-state"><p>暂无单位数据</p></div>' :
            this.state.rescueUnits.map(u => `
              <div class="card" style="margin-bottom:8px;padding:12px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-weight:600">${u.name || u.unit_name || '救援单位'}</span>
                  <span class="badge badge-${u.status === 'available' ? 'success' : u.status === 'dispatched' ? 'warning' : 'info'}">${u.status === 'available' ? '可用' : u.status === 'dispatched' ? '已派遣' : '待命'}</span>
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${u.type || u.unit_type || ''} | 人数: ${u.personnel_count || u.count || '-'}</div>
              </div>
            `).join('')}
        </div>
      </div>`;

    document.getElementById('schedule-force-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const selectedUnits = Array.from(form.unit_id.selectedOptions).map(o => o.value);
      const data = {
        unit_ids: selectedUnits,
        strategy: form.strategy.value,
        building_id: parseInt(form.building_id.value)
      };
      const result = await this.apiPost('/api/v1/rescue-units/schedule', data);
      if (result) {
        this.showToast('兵力调度指令已发送', 'success');
      } else {
        this.showToast('调度请求已发送', 'info');
      }
    });
  }

  async simulatePlan(idx) {
    const plan = this.state.rescuePlans[idx];
    if (!plan) return;
    const planId = plan.id || plan.plan_id || (idx + 1);
    const result = await this.apiPost(`/api/v1/rescue-plans/${planId}/simulate`, {});

    const steps = (result && result.steps) || [
      { step: 1, action: '集结救援力量', duration: '5分钟' },
      { step: 2, action: '抵达现场', duration: '8分钟' },
      { step: 3, action: '建立救援通道', duration: '10分钟' },
      { step: 4, action: '执行人员搜救', duration: '15分钟' },
      { step: 5, action: '转移被困人员', duration: '12分钟' },
      { step: 6, action: '确认清场完毕', duration: '5分钟' }
    ];

    const el = document.getElementById(`simulation-result-${idx}`);
    if (!el) return;

    let timelineHtml = '<div class="timeline">';
    steps.forEach((s, i) => {
      const cls = i === 0 ? 'active' : i < 2 ? 'completed' : '';
      timelineHtml += `
        <div class="timeline-item ${cls}">
          <div class="timeline-content">${s.action}</div>
          <div class="timeline-time">步骤${s.step || i + 1} · ${s.duration || '-'}</div>
        </div>`;
    });
    timelineHtml += '</div>';

    el.innerHTML = `
      <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">模拟推演结果</h4>
      ${timelineHtml}`;
  }

  async loadCommand() {
    const container = document.getElementById('page-command');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    const buildings = this.state.buildings.length > 0 ? this.state.buildings : [{ id: 1, name: '建筑1' }];
    let allCommands = [];
    for (const b of buildings) {
      const data = await this.apiGet(`/api/v1/buildings/${b.id}/commands`);
      if (data) {
        const cmds = data.commands || (Array.isArray(data) ? data : []);
        allCommands = allCommands.concat(cmds);
      }
    }
    this.state.commands = allCommands;
    this.renderCommand();
    this.timers.push(setInterval(() => this.loadCommand(), 2000));
  }

  renderCommand() {
    const container = document.getElementById('page-command');
    const commands = this.state.commands;

    const priorityMap = {
      'urgent': { text: '紧急', badge: 'danger' },
      'important': { text: '重要', badge: 'warning' },
      'normal': { text: '普通', badge: 'info' }
    };

    let commandListHtml = '';
    if (commands.length === 0) {
      commandListHtml = '<div class="empty-state"><div class="empty-icon">📡</div><p>暂无指令</p></div>';
    } else {
      commands.forEach(cmd => {
        const p = priorityMap[cmd.priority] || priorityMap['normal'];
        commandListHtml += `
          <div class="command-item">
            <div class="command-priority">
              <span class="badge badge-${p.badge}">${p.text}</span>
            </div>
            <div class="command-content">
              <div style="font-size:14px">${cmd.content || cmd.message || '-'}</div>
              <div class="command-meta">
                <span>来自: ${cmd.from_unit || cmd.from || '-'}</span>
                <span>发往: ${cmd.to_unit || cmd.to || '-'}</span>
                <span>${this.formatDate(cmd.created_at || cmd.timestamp)}</span>
              </div>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="two-column">
        <div>
          <h3 class="section-title">📡 指令列表</h3>
          <div class="command-panel" id="command-list">
            ${commandListHtml}
          </div>
        </div>
        <div>
          <h3 class="section-title">📤 发送指令</h3>
          <div class="card">
            <form id="send-command-form">
              <div class="form-group">
                <label>发送单位</label>
                <input class="form-input" name="from_unit" placeholder="请输入发送单位" required>
              </div>
              <div class="form-group">
                <label>接收单位</label>
                <input class="form-input" name="to_unit" placeholder="请输入接收单位" required>
              </div>
              <div class="form-group">
                <label>指令内容</label>
                <textarea class="form-textarea" name="content" placeholder="请输入指令内容" required></textarea>
              </div>
              <div class="form-group">
                <label>优先级</label>
                <select class="form-select" name="priority">
                  <option value="normal">普通</option>
                  <option value="important">重要</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">发送指令</button>
            </form>
          </div>
        </div>
      </div>`;

    document.getElementById('send-command-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        from_unit: form.from_unit.value,
        to_unit: form.to_unit.value,
        content: form.content.value,
        priority: form.priority.value
      };
      const result = await this.apiPost('/api/v1/commands', data);
      if (result) {
        this.showToast('指令已发送', 'success');
        form.reset();
        this.loadCommand();
      } else {
        this.showToast('发送失败，请重试', 'error');
      }
    });
  }

  async loadResource() {
    const container = document.getElementById('page-resource');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    const data = await this.apiGet('/api/v1/resources');
    if (data) this.state.resources = data.resources || (Array.isArray(data) ? data : []);

    this.renderResource();
  }

  renderResource() {
    const container = document.getElementById('page-resource');
    const resources = this.state.resources;

    const typeSummary = {};
    resources.forEach(r => {
      const t = r.type || r.resource_type || '其他';
      if (!typeSummary[t]) typeSummary[t] = { count: 0, available: 0 };
      typeSummary[t].count += r.quantity || r.total || 0;
      typeSummary[t].available += r.available || r.quantity || r.total || 0;
    });

    let summaryHtml = '';
    Object.entries(typeSummary).forEach(([type, info]) => {
      summaryHtml += `
        <div class="summary-item">
          <span class="summary-count" style="color:var(--accent-cyan)">${info.available}</span>
          <span class="summary-label">${type} (总计${info.count})</span>
        </div>`;
    });

    let cardsHtml = '';
    if (resources.length === 0) {
      cardsHtml = '<div class="empty-state"><div class="empty-icon">📦</div><p>暂无资源数据</p></div>';
    } else {
      resources.forEach((r, idx) => {
        const statusMap = {
          'available': { text: '可用', badge: 'success' },
          'in_use': { text: '使用中', badge: 'warning' },
          'dispatched': { text: '已派遣', badge: 'info' },
          'depleted': { text: '耗尽', badge: 'danger' }
        };
        const st = statusMap[r.status] || statusMap['available'];

        cardsHtml += `
          <div class="resource-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="resource-name">${r.name || r.resource_name || '资源'}</span>
              <span class="badge badge-${st.badge}">${st.text}</span>
            </div>
            <div class="resource-type">${r.type || r.resource_type || '-'}</div>
            <div class="resource-quantity">${r.quantity || r.total || 0}</div>
            <div style="margin-top:8px">
              <button class="btn btn-sm btn-warning" onclick="app.dispatchResource(${idx})">调度</button>
            </div>
          </div>`;
      });
    }

    container.innerHTML = `
      <div class="summary-bar">${summaryHtml || '<div class="summary-item"><span class="summary-count" style="color:var(--accent-cyan)">0</span><span class="summary-label">资源总计</span></div>'}</div>
      <div class="dashboard-grid">${cardsHtml}</div>`;
  }

  async dispatchResource(idx) {
    const r = this.state.resources[idx];
    if (!r) return;
    const rId = r.id || r.resource_id || (idx + 1);

    this.showModal('调度资源', `
      <form id="dispatch-resource-form">
        <div class="form-group">
          <label>资源名称</label>
          <input class="form-input" value="${r.name || r.resource_name || ''}" disabled>
        </div>
        <div class="form-group">
          <label>调度数量</label>
          <input class="form-input" name="quantity" type="number" min="1" max="${r.quantity || r.total || 1}" value="1" required>
        </div>
        <div class="form-group">
          <label>目标位置</label>
          <input class="form-input" name="destination" placeholder="请输入目标位置" required>
        </div>
        <div style="text-align:right">
          <button type="submit" class="btn btn-warning">确认调度</button>
        </div>
      </form>
    `);

    document.getElementById('dispatch-resource-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = {
        quantity: parseInt(form.quantity.value),
        destination: form.destination.value
      };
      const result = await this.apiPost(`/api/v1/resources/${rId}/dispatch`, data);
      if (result) {
        this.showToast('资源调度成功', 'success');
        this.hideModal();
        this.loadResource();
      } else {
        this.showToast('调度请求已发送', 'info');
        this.hideModal();
      }
    });
  }

  async loadMonitor() {
    const container = document.getElementById('page-monitor');
    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>';

    const [status, traces] = await Promise.all([
      this.apiGet('/api/v1/monitor/status'),
      this.apiGet('/api/v1/monitor/traces')
    ]);

    if (status) this.state.monitorStatus = status;
    if (traces) this.state.traces = traces.traces || (Array.isArray(traces) ? traces : []);

    this.renderMonitor();
    this.timers.push(setInterval(() => this.loadMonitor(), 10000));
  }

  renderMonitor() {
    const container = document.getElementById('page-monitor');
    const s = this.state.monitorStatus || {};

    let tracesHtml = '';
    if (this.state.traces.length === 0) {
      tracesHtml = '<div class="empty-state"><p>暂无追踪数据</p></div>';
    } else {
      let rows = '';
      this.state.traces.forEach(t => {
        const statusBadge = t.status === 'ok' ? 'success' : t.status === 'error' ? 'danger' : 'warning';
        rows += `
          <tr>
            <td style="font-family:monospace;font-size:12px">${t.trace_id || t.id || '-'}</td>
            <td>${t.service || '-'}</td>
            <td>${t.operation || t.method || '-'}</td>
            <td>${t.duration || '-'}</td>
            <td><span class="badge badge-${statusBadge}">${t.status || '-'}</span></td>
          </tr>`;
      });
      tracesHtml = `
        <table class="data-table">
          <thead>
            <tr>
              <th>追踪ID</th>
              <th>服务</th>
              <th>操作</th>
              <th>耗时</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    container.innerHTML = `
      <div class="dashboard-grid" style="margin-bottom:20px">
        <div class="stat-card stat-success">
          <div class="stat-label">系统运行时间</div>
          <div class="stat-value">${s.uptime || '-'}</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-label">活跃火情</div>
          <div class="stat-value">${s.active_fires ?? 0}</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-label">平均响应时间</div>
          <div class="stat-value">${s.avg_response_time || s.response_time || '-'}</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-label">系统状态</div>
          <div class="stat-value" style="font-size:20px">${s.system_status || '运行中'}</div>
        </div>
      </div>
      <h3 class="section-title">📈 追踪列表</h3>
      <div class="card">${tracesHtml}</div>
      <h3 class="section-title">🔍 Jaeger 追踪</h3>
      <div class="card">
        <div style="margin-bottom:10px">
          <a href="http://localhost:16686" target="_blank" class="btn btn-sm btn-outline">打开 Jaeger UI</a>
        </div>
        <div class="iframe-container">
          <iframe src="http://localhost:16686" title="Jaeger UI"></iframe>
        </div>
      </div>`;
  }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
