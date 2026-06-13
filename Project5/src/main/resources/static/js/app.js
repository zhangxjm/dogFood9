const API_BASE = '/api';

let currentPage = 0;
let pageSize = 20;
let currentAlertsPage = 0;
let currentUsersPage = 0;
let refreshInterval;

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadDashboard();
    startAutoRefresh();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            switchPage(page);
        });
    });
}

function switchPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById('page-' + page).classList.add('active');

    const titles = {
        dashboard: '监控仪表盘',
        transactions: '交易监控',
        alerts: '风险告警',
        rules: '规则引擎管理',
        users: '用户管理',
        blacklist: '黑名单管理'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    if (page === 'transactions') {
        loadTransactions();
    } else if (page === 'alerts') {
        loadAlerts();
    } else if (page === 'rules') {
        loadRules();
    } else if (page === 'users') {
        loadUsers();
    } else if (page === 'blacklist') {
        loadBlacklist();
    }
}

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        if (document.getElementById('page-dashboard').classList.contains('active')) {
            loadDashboard();
        }
    }, 5000);
}

async function loadDashboard() {
    try {
        const [summaryRes, txnRes, alertsRes] = await Promise.all([
            fetch(API_BASE + '/dashboard/summary'),
            fetch(API_BASE + '/transactions/recent?limit=10'),
            fetch(API_BASE + '/alerts/recent?limit=8')
        ]);

        const summary = await summaryRes.json();
        const transactions = await txnRes.json();
        const alerts = await alertsRes.json();

        updateDashboardStats(summary);
        updateRecentTransactions(transactions);
        updateRecentAlerts(alerts);
        updateAlertBadge(summary.alerts.pending);
        updateSystemStatus(summary);
    } catch (e) {
        console.error('Failed to load dashboard:', e);
    }
}

function updateDashboardStats(summary) {
    const tx = summary.transactions || {};
    document.getElementById('statTotalTxn').textContent = formatNumber(tx.todayTotal || 0);
    document.getElementById('statApproved').textContent = formatNumber(tx.approved || 0);
    document.getElementById('statRejected').textContent = formatNumber(tx.rejected || 0);
    document.getElementById('statPending').textContent = formatNumber(tx.pending || 0);
    document.getElementById('statThroughput').textContent = tx.streamThroughput || '0';
    document.getElementById('statUsers').textContent = formatNumber(summary.users?.totalUsers || 0);

    const total = (tx.highRisk || 0) + (tx.mediumRisk || 0) + (tx.lowRisk || 0) || 1;
    const highPct = Math.round((tx.highRisk || 0) / total * 100);
    const mediumPct = Math.round((tx.mediumRisk || 0) / total * 100);
    const lowPct = Math.round((tx.lowRisk || 0) / total * 100);

    document.getElementById('riskHighBar').style.width = Math.max(highPct, 5) + '%';
    document.getElementById('riskMediumBar').style.width = Math.max(mediumPct, 5) + '%';
    document.getElementById('riskLowBar').style.width = Math.max(lowPct, 5) + '%';
    document.getElementById('riskHighValue').textContent = formatNumber(tx.highRisk || 0);
    document.getElementById('riskMediumValue').textContent = formatNumber(tx.mediumRisk || 0);
    document.getElementById('riskLowValue').textContent = formatNumber(tx.lowRisk || 0);

    document.getElementById('metricQueue').textContent = formatNumber(tx.streamQueueSize || 0);
    document.getElementById('metricProcessed').textContent = formatNumber(tx.streamProcessed || 0);
    document.getElementById('metricTps').textContent = (tx.streamThroughput || '0') + ' TPS';
    document.getElementById('metricBlacklist').textContent = formatNumber(summary.blacklistCount || 0);
}

function updateRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:24px;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr onclick="showTransactionDetail('${tx.transactionId}')" style="cursor:pointer;">
            <td style="font-family:monospace;font-size:12px;">${tx.transactionId}</td>
            <td>${tx.userId}</td>
            <td style="font-weight:600;">¥${formatAmount(tx.amount)}</td>
            <td>${tx.merchant || '-'}</td>
            <td><span class="risk-badge risk-${(tx.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(tx.riskLevel)}</span></td>
            <td><span class="status-badge status-${(tx.status || 'pending').toLowerCase()}">${getStatusText(tx.status)}</span></td>
            <td style="font-size:12px;color:#6b7280;">${formatTime(tx.createdAt)}</td>
        </tr>
    `).join('');
}

function updateRecentAlerts(alerts) {
    const list = document.getElementById('recentAlertsList');
    if (!alerts || alerts.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:24px;">暂无告警</div>';
        return;
    }

    list.innerHTML = alerts.map(alert => `
        <div class="alert-item ${(alert.alertLevel || 'low').toLowerCase()}" onclick="showAlertDetail('${alert.alertId}')">
            <div class="alert-header">
                <span class="alert-type">${alert.alertType || '风险告警'}</span>
                <span class="alert-time">${formatTime(alert.createdAt)}</span>
            </div>
            <div class="alert-desc">${alert.description || '-'}</div>
            <div class="alert-footer">
                <span class="alert-txn">交易: ${alert.transactionId}</span>
                <span class="risk-badge risk-${(alert.alertLevel || 'low').toLowerCase()}">${getRiskLevelText(alert.alertLevel)}</span>
            </div>
        </div>
    `).join('');
}

function updateAlertBadge(count) {
    const badge = document.getElementById('alertBadge');
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function updateSystemStatus(summary) {
    const streamDot = document.getElementById('streamStatusDot');
    const streamText = document.getElementById('streamStatusText');
    if (summary.streamRunning) {
        streamDot.className = 'status-dot status-running';
        streamText.textContent = '运行中';
    } else {
        streamDot.className = 'status-dot status-stopped';
        streamText.textContent = '已停止';
    }

    const mockDot = document.getElementById('mockStatusDot');
    const mockText = document.getElementById('mockStatusText');
    const mockBtnText = document.getElementById('mockBtnText');
    if (summary.mockGeneratorRunning) {
        mockDot.style.display = 'inline-block';
        mockDot.className = 'status-dot status-running';
        mockText.textContent = '模拟生成中';
        mockBtnText.textContent = '⏸ 停止模拟';
    } else {
        mockDot.style.display = 'none';
        mockText.textContent = '';
        mockBtnText.textContent = '▶ 启动模拟';
    }
}

async function loadTransactions() {
    const status = document.getElementById('txnStatusFilter')?.value || '';
    const riskLevel = document.getElementById('txnRiskFilter')?.value || '';
    const userId = document.getElementById('txnUserIdFilter')?.value || '';

    let url = `${API_BASE}/transactions?page=${currentPage}&size=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (riskLevel) url += `&riskLevel=${riskLevel}`;
    if (userId) url += `&userId=${userId}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderTransactions(data.content || []);
        document.getElementById('pageInfo').textContent = `第 ${currentPage + 1} / ${data.totalPages || 1} 页`;
        document.getElementById('prevBtn').disabled = currentPage === 0;
        document.getElementById('nextBtn').disabled = currentPage >= (data.totalPages || 1) - 1;
    } catch (e) {
        console.error('Failed to load transactions:', e);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#9ca3af;padding:24px;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td style="font-family:monospace;font-size:12px;">${tx.transactionId}</td>
            <td>${tx.userId}</td>
            <td style="font-weight:600;">¥${formatAmount(tx.amount)}</td>
            <td>${tx.merchant || '-'}</td>
            <td>${tx.transactionType || '-'}</td>
            <td style="font-weight:600;color:${getRiskColor(tx.riskLevel)};">${tx.riskScore || 0}</td>
            <td><span class="risk-badge risk-${(tx.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(tx.riskLevel)}</span></td>
            <td><span class="status-badge status-${(tx.status || 'pending').toLowerCase()}">${getStatusText(tx.status)}</span></td>
            <td style="font-size:12px;color:#6b7280;">${formatTime(tx.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showTransactionDetail('${tx.transactionId}')">详情</button>
                ${tx.status === 'PENDING' ? `
                    <button class="btn btn-sm btn-success" onclick="approveTransaction('${tx.transactionId}')">通过</button>
                    <button class="btn btn-sm btn-danger" onclick="rejectTransaction('${tx.transactionId}')">拒绝</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        loadTransactions();
    }
}

function nextPage() {
    currentPage++;
    loadTransactions();
}

async function loadAlerts() {
    const status = document.getElementById('alertStatusFilter')?.value || '';
    const level = document.getElementById('alertLevelFilter')?.value || '';

    let url = `${API_BASE}/alerts?page=${currentAlertsPage}&size=${pageSize}`;
    if (status) url += `&status=${status}`;
    if (level) url += `&level=${level}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderAlerts(data.content || []);
        document.getElementById('alertsPageInfo').textContent = `第 ${currentAlertsPage + 1} / ${data.totalPages || 1} 页`;
    } catch (e) {
        console.error('Failed to load alerts:', e);
    }
}

function renderAlerts(alerts) {
    const tbody = document.getElementById('alertsBody');
    if (!alerts || alerts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#9ca3af;padding:24px;">暂无告警</td></tr>';
        return;
    }

    tbody.innerHTML = alerts.map(alert => `
        <tr>
            <td style="font-family:monospace;font-size:12px;">${alert.alertId}</td>
            <td style="font-family:monospace;font-size:12px;">${alert.transactionId}</td>
            <td>${alert.userId}</td>
            <td>${alert.alertType || '-'}</td>
            <td><span class="risk-badge risk-${(alert.alertLevel || 'low').toLowerCase()}">${getRiskLevelText(alert.alertLevel)}</span></td>
            <td style="font-weight:600;">${alert.riskScore || '-'}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${alert.description || '-'}</td>
            <td><span class="status-badge status-${(alert.alertStatus === 'PENDING' ? 'pending' : 'approved').toLowerCase()}">${getAlertStatusText(alert.alertStatus)}</span></td>
            <td style="font-size:12px;color:#6b7280;">${formatTime(alert.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showAlertDetail('${alert.alertId}')">详情</button>
                ${alert.alertStatus === 'PENDING' ? `
                    <button class="btn btn-sm btn-success" onclick="handleAlert('${alert.alertId}', 'HANDLED')">处理</button>
                    <button class="btn btn-sm btn-secondary" onclick="handleAlert('${alert.alertId}', 'DISMISSED')">忽略</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function prevAlertsPage() {
    if (currentAlertsPage > 0) {
        currentAlertsPage--;
        loadAlerts();
    }
}

function nextAlertsPage() {
    currentAlertsPage++;
    loadAlerts();
}

async function loadRules() {
    try {
        const res = await fetch(API_BASE + '/rules');
        const rules = await res.json();
        renderRules(rules);
    } catch (e) {
        console.error('Failed to load rules:', e);
    }
}

function renderRules(rules) {
    const grid = document.getElementById('rulesGrid');
    if (!rules || rules.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#9ca3af;padding:48px;">暂无规则</div>';
        return;
    }

    grid.innerHTML = rules.map(rule => `
        <div class="rule-card ${rule.enabled ? '' : 'disabled'}">
            <div class="rule-header">
                <div class="rule-name">${rule.ruleName}</div>
                <span class="rule-severity severity-${(rule.severity || 'low').toLowerCase()}">${getSeverityText(rule.severity)}</span>
            </div>
            <div class="rule-desc">${rule.description || '暂无描述'}</div>
            <div class="rule-meta">
                <div class="rule-score">权重: <strong>${rule.scoreWeight || 0}</strong> 分</div>
                <div class="rule-actions">
                    <button class="btn btn-sm ${rule.enabled ? 'btn-warning' : 'btn-success'}" onclick="toggleRule('${rule.ruleCode}', ${rule.enabled})">
                        ${rule.enabled ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editRule('${rule.ruleCode}')">编辑</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadUsers() {
    const keyword = document.getElementById('userSearch')?.value || '';
    let url = `${API_BASE}/users?page=${currentUsersPage}&size=${pageSize}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderUsers(data.content || []);
        document.getElementById('usersPageInfo').textContent = `第 ${currentUsersPage + 1} / ${data.totalPages || 1} 页`;
    } catch (e) {
        console.error('Failed to load users:', e);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersBody');
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:24px;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.userId}</td>
            <td>${user.userName}</td>
            <td style="font-family:monospace;font-size:12px;">${user.accountNumber}</td>
            <td>${getAccountTypeText(user.accountType)}</td>
            <td><span class="risk-badge risk-${(user.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(user.riskLevel)}</span></td>
            <td><span class="status-badge status-${(user.accountStatus === 'ACTIVE' ? 'approved' : 'rejected').toLowerCase()}">${getAccountStatusText(user.accountStatus)}</span></td>
            <td style="font-weight:600;">¥${formatAmount(user.accountBalance)}</td>
            <td>${user.registeredCity || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showUserDetail('${user.userId}')">详情</button>
                ${user.accountStatus === 'ACTIVE' ? `
                    <button class="btn btn-sm btn-danger" onclick="freezeUser('${user.userId}')">冻结</button>
                ` : `
                    <button class="btn btn-sm btn-success" onclick="unfreezeUser('${user.userId}')">解冻</button>
                `}
            </td>
        </tr>
    `).join('');
}

function prevUsersPage() {
    if (currentUsersPage > 0) {
        currentUsersPage--;
        loadUsers();
    }
}

function nextUsersPage() {
    currentUsersPage++;
    loadUsers();
}

async function loadBlacklist() {
    const type = document.getElementById('blacklistTypeFilter')?.value || '';
    let url = API_BASE + '/blacklist';
    if (type) url += `?type=${type}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderBlacklist(data);
    } catch (e) {
        console.error('Failed to load blacklist:', e);
    }
}

function renderBlacklist(items) {
    const tbody = document.getElementById('blacklistBody');
    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#9ca3af;padding:24px;">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${getBlacklistTypeText(item.blacklistType)}</td>
            <td style="font-family:monospace;">${item.blacklistValue}</td>
            <td>${item.description || '-'}</td>
            <td><span class="risk-badge risk-${(item.riskLevel || 'high').toLowerCase()}">${getRiskLevelText(item.riskLevel)}</span></td>
            <td>${item.source || '-'}</td>
            <td style="font-size:12px;color:#6b7280;">${formatTime(item.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeBlacklist('${item.blacklistType}', '${item.blacklistValue}')">移除</button>
            </td>
        </tr>
    `).join('');
}

async function showTransactionDetail(transactionId) {
    try {
        const res = await fetch(`${API_BASE}/transactions/${transactionId}`);
        const tx = await res.json();
        if (!tx) return;

        const content = `
            <div class="detail-row">
                <div class="detail-label">交易ID</div>
                <div class="detail-value">${tx.transactionId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">用户ID</div>
                <div class="detail-value">${tx.userId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">交易金额</div>
                <div class="detail-value" style="color:#ef4444;font-size:20px;font-weight:700;">¥${formatAmount(tx.amount)} ${tx.currency || 'CNY'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">商户</div>
                <div class="detail-value">${tx.merchant || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">交易类型</div>
                <div class="detail-value">${tx.transactionType || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">风险评分</div>
                <div class="detail-value" style="color:${getRiskColor(tx.riskLevel)};font-weight:700;">${tx.riskScore || 0} / 100</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">风险等级</div>
                <div class="detail-value"><span class="risk-badge risk-${(tx.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(tx.riskLevel)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">交易状态</div>
                <div class="detail-value"><span class="status-badge status-${(tx.status || 'pending').toLowerCase()}">${getStatusText(tx.status)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">付款账户</div>
                <div class="detail-value" style="font-family:monospace;">${tx.fromAccount}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">收款账户</div>
                <div class="detail-value" style="font-family:monospace;">${tx.toAccount}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">IP地址</div>
                <div class="detail-value">${tx.ipAddress || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">设备ID</div>
                <div class="detail-value">${tx.deviceId || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">交易地点</div>
                <div class="detail-value">${tx.location || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">风险原因</div>
                <div class="detail-value" style="color:#6b7280;font-size:13px;">${tx.riskReasons || '无'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">创建时间</div>
                <div class="detail-value">${formatTime(tx.createdAt)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">处理时间</div>
                <div class="detail-value">${tx.processedAt ? formatTime(tx.processedAt) : '处理中...'}</div>
            </div>
        `;

        let footerButtons = '';
        if (tx.status === 'PENDING') {
            footerButtons = `
                <button class="btn btn-success" onclick="approveTransaction('${tx.transactionId}');closeModal();">通过交易</button>
                <button class="btn btn-danger" onclick="rejectTransaction('${tx.transactionId}');closeModal();">拒绝交易</button>
            `;
        }

        showModal('交易详情', content, footerButtons);
    } catch (e) {
        console.error('Failed to load transaction detail:', e);
    }
}

async function showAlertDetail(alertId) {
    try {
        const res = await fetch(`${API_BASE}/alerts/${alertId}`);
        const alert = await res.json();
        if (!alert) return;

        const content = `
            <div class="detail-row">
                <div class="detail-label">告警ID</div>
                <div class="detail-value">${alert.alertId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">关联交易</div>
                <div class="detail-value">${alert.transactionId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">用户ID</div>
                <div class="detail-value">${alert.userId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">告警类型</div>
                <div class="detail-value">${alert.alertType || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">告警级别</div>
                <div class="detail-value"><span class="risk-badge risk-${(alert.alertLevel || 'low').toLowerCase()}">${getRiskLevelText(alert.alertLevel)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">风险评分</div>
                <div class="detail-value" style="color:${getRiskColor(alert.alertLevel)};font-weight:700;">${alert.riskScore || 0}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">告警描述</div>
                <div class="detail-value">${alert.description || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">触发规则</div>
                <div class="detail-value" style="font-size:13px;color:#6b7280;">${alert.triggeredRules || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">告警状态</div>
                <div class="detail-value"><span class="status-badge status-${(alert.alertStatus === 'PENDING' ? 'pending' : 'approved').toLowerCase()}">${getAlertStatusText(alert.alertStatus)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">创建时间</div>
                <div class="detail-value">${formatTime(alert.createdAt)}</div>
            </div>
            ${alert.handledAt ? `
            <div class="detail-row">
                <div class="detail-label">处理人</div>
                <div class="detail-value">${alert.handledBy || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">处理时间</div>
                <div class="detail-value">${formatTime(alert.handledAt)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">处理备注</div>
                <div class="detail-value">${alert.handleNote || '-'}</div>
            </div>
            ` : ''}
        `;

        let footerButtons = '';
        if (alert.alertStatus === 'PENDING') {
            footerButtons = `
                <button class="btn btn-secondary" onclick="handleAlert('${alert.alertId}', 'DISMISSED');closeModal();">忽略告警</button>
                <button class="btn btn-success" onclick="handleAlert('${alert.alertId}', 'HANDLED');closeModal();">标记已处理</button>
            `;
        }

        showModal('告警详情', content, footerButtons);
    } catch (e) {
        console.error('Failed to load alert detail:', e);
    }
}

async function showUserDetail(userId) {
    try {
        const res = await fetch(`${API_BASE}/users/${userId}`);
        const user = await res.json();
        if (!user) return;

        const content = `
            <div class="detail-row">
                <div class="detail-label">用户ID</div>
                <div class="detail-value">${user.userId}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">姓名</div>
                <div class="detail-value">${user.userName}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">账号</div>
                <div class="detail-value" style="font-family:monospace;">${user.accountNumber}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">账户类型</div>
                <div class="detail-value">${getAccountTypeText(user.accountType)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">账户状态</div>
                <div class="detail-value"><span class="status-badge status-${(user.accountStatus === 'ACTIVE' ? 'approved' : 'rejected').toLowerCase()}">${getAccountStatusText(user.accountStatus)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">风险等级</div>
                <div class="detail-value"><span class="risk-badge risk-${(user.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(user.riskLevel)}</span></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">账户余额</div>
                <div class="detail-value" style="color:#16a34a;font-weight:700;">¥${formatAmount(user.accountBalance)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">日交易限额</div>
                <div class="detail-value">¥${formatAmount(user.dailyTransactionLimit)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">信用评分</div>
                <div class="detail-value">${user.creditScore || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">身份证号</div>
                <div class="detail-value">${user.idCardNumber || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">手机号</div>
                <div class="detail-value">${user.phoneNumber || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">邮箱</div>
                <div class="detail-value">${user.email || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">注册地址</div>
                <div class="detail-value">${user.registeredAddress || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">注册城市</div>
                <div class="detail-value">${user.registeredCity || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">上次登录</div>
                <div class="detail-value">${user.lastLoginTime ? formatTime(user.lastLoginTime) : '-'}</div>
            </div>
        `;

        let footerButtons = '';
        if (user.accountStatus === 'ACTIVE') {
            footerButtons = `<button class="btn btn-danger" onclick="freezeUser('${user.userId}');closeModal();">冻结账户</button>`;
        } else {
            footerButtons = `<button class="btn btn-success" onclick="unfreezeUser('${user.userId}');closeModal();">解冻账户</button>`;
        }

        showModal('用户详情', content, footerButtons);
    } catch (e) {
        console.error('Failed to load user detail:', e);
    }
}

function showAddRuleModal() {
    const content = `
        <div class="form-group">
            <label>规则编码</label>
            <input type="text" id="newRuleCode" placeholder="例如: NEW_RULE_001">
        </div>
        <div class="form-group">
            <label>规则名称</label>
            <input type="text" id="newRuleName" placeholder="输入规则名称">
        </div>
        <div class="form-group">
            <label>规则描述</label>
            <textarea id="newRuleDesc" rows="3" placeholder="输入规则描述"></textarea>
        </div>
        <div class="form-group">
            <label>规则类型</label>
            <select id="newRuleType">
                <option value="AMOUNT">金额类</option>
                <option value="VELOCITY">速率类</option>
                <option value="LIMIT">限额类</option>
                <option value="BLACKLIST">黑名单类</option>
                <option value="TIME">时间类</option>
                <option value="LOCATION">地点类</option>
                <option value="DEVICE">设备类</option>
                <option value="BEHAVIOR">行为类</option>
                <option value="MERCHANT">商户类</option>
            </select>
        </div>
        <div class="form-group">
            <label>严重级别</label>
            <select id="newRuleSeverity">
                <option value="CRITICAL">严重</option>
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
            </select>
        </div>
        <div class="form-group">
            <label>风险权重(分)</label>
            <input type="number" id="newRuleScore" value="10" min="0" max="100">
        </div>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="addRule()">创建规则</button>
    `;

    showModal('新增风险规则', content, footer);
}

function showAddBlacklistModal() {
    const content = `
        <div class="form-group">
            <label>类型</label>
            <select id="newBlacklistType">
                <option value="IP">IP地址</option>
                <option value="CARD">卡号</option>
                <option value="ACCOUNT">账户</option>
                <option value="USER">用户</option>
                <option value="MERCHANT">商户</option>
            </select>
        </div>
        <div class="form-group">
            <label>值</label>
            <input type="text" id="newBlacklistValue" placeholder="输入黑名单值">
        </div>
        <div class="form-group">
            <label>描述</label>
            <input type="text" id="newBlacklistDesc" placeholder="输入描述信息">
        </div>
        <div class="form-group">
            <label>风险级别</label>
            <select id="newBlacklistLevel">
                <option value="HIGH">高</option>
                <option value="MEDIUM">中</option>
                <option value="LOW">低</option>
            </select>
        </div>
    `;

    const footer = `
        <button class="btn btn-secondary" onclick="closeModal()">取消</button>
        <button class="btn btn-primary" onclick="addBlacklist()">添加</button>
    `;

    showModal('添加黑名单', content, footer);
}

async function addRule() {
    const code = document.getElementById('newRuleCode').value;
    const name = document.getElementById('newRuleName').value;
    const desc = document.getElementById('newRuleDesc').value;
    const type = document.getElementById('newRuleType').value;
    const severity = document.getElementById('newRuleSeverity').value;
    const score = parseFloat(document.getElementById('newRuleScore').value);

    if (!code || !name) {
        alert('请填写规则编码和名称');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/rules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ruleCode: code,
                ruleName: name,
                description: desc,
                ruleType: type,
                severity: severity,
                scoreWeight: score,
                enabled: true,
                createdBy: 'ADMIN'
            })
        });
        if (res.ok) {
            closeModal();
            loadRules();
        }
    } catch (e) {
        console.error('Failed to add rule:', e);
    }
}

async function editRule(ruleCode) {
    try {
        const res = await fetch(`${API_BASE}/rules/${ruleCode}`);
        const rule = await res.json();
        if (!rule) return;

        const content = `
            <div class="form-group">
                <label>规则名称</label>
                <input type="text" id="editRuleName" value="${rule.ruleName}">
            </div>
            <div class="form-group">
                <label>规则描述</label>
                <textarea id="editRuleDesc" rows="3">${rule.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>严重级别</label>
                <select id="editRuleSeverity">
                    <option value="CRITICAL" ${rule.severity === 'CRITICAL' ? 'selected' : ''}>严重</option>
                    <option value="HIGH" ${rule.severity === 'HIGH' ? 'selected' : ''}>高</option>
                    <option value="MEDIUM" ${rule.severity === 'MEDIUM' ? 'selected' : ''}>中</option>
                    <option value="LOW" ${rule.severity === 'LOW' ? 'selected' : ''}>低</option>
                </select>
            </div>
            <div class="form-group">
                <label>风险权重(分)</label>
                <input type="number" id="editRuleScore" value="${rule.scoreWeight || 10}" min="0" max="100">
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="closeModal()">取消</button>
            <button class="btn btn-primary" onclick="saveRule('${ruleCode}')">保存</button>
        `;

        showModal('编辑规则', content, footer);
    } catch (e) {
        console.error('Failed to edit rule:', e);
    }
}

async function saveRule(ruleCode) {
    const name = document.getElementById('editRuleName').value;
    const desc = document.getElementById('editRuleDesc').value;
    const severity = document.getElementById('editRuleSeverity').value;
    const score = parseFloat(document.getElementById('editRuleScore').value);

    try {
        const res = await fetch(`${API_BASE}/rules/${ruleCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ruleName: name,
                description: desc,
                severity: severity,
                scoreWeight: score
            })
        });
        if (res.ok) {
            closeModal();
            loadRules();
        }
    } catch (e) {
        console.error('Failed to save rule:', e);
    }
}

async function toggleRule(ruleCode, currentEnabled) {
    try {
        const url = currentEnabled ?
            `${API_BASE}/rules/${ruleCode}/disable` :
            `${API_BASE}/rules/${ruleCode}/enable`;
        await fetch(url, { method: 'POST' });
        loadRules();
    } catch (e) {
        console.error('Failed to toggle rule:', e);
    }
}

async function addBlacklist() {
    const type = document.getElementById('newBlacklistType').value;
    const value = document.getElementById('newBlacklistValue').value;
    const desc = document.getElementById('newBlacklistDesc').value;
    const level = document.getElementById('newBlacklistLevel').value;

    if (!value) {
        alert('请输入黑名单值');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/blacklist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                value: value,
                description: desc,
                riskLevel: level,
                source: 'MANUAL'
            })
        });
        if (res.ok) {
            closeModal();
            loadBlacklist();
        }
    } catch (e) {
        console.error('Failed to add blacklist:', e);
    }
}

async function removeBlacklist(type, value) {
    if (!confirm('确定要移除该黑名单条目吗？')) return;

    try {
        await fetch(`${API_BASE}/blacklist?type=${type}&value=${encodeURIComponent(value)}`, {
            method: 'DELETE'
        });
        loadBlacklist();
    } catch (e) {
        console.error('Failed to remove blacklist:', e);
    }
}

async function approveTransaction(transactionId) {
    try {
        await fetch(`${API_BASE}/transactions/${transactionId}/approve`, { method: 'POST' });
        loadTransactions();
        loadDashboard();
    } catch (e) {
        console.error('Failed to approve transaction:', e);
    }
}

async function rejectTransaction(transactionId) {
    if (!confirm('确定要拒绝该交易吗？')) return;

    try {
        await fetch(`${API_BASE}/transactions/${transactionId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: '风控审核拒绝' })
        });
        loadTransactions();
        loadDashboard();
    } catch (e) {
        console.error('Failed to reject transaction:', e);
    }
}

async function handleAlert(alertId, status) {
    try {
        await fetch(`${API_BASE}/alerts/${alertId}/handle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                handler: '管理员',
                status: status,
                note: status === 'HANDLED' ? '已人工审核处理' : '经核查为正常交易'
            })
        });
        loadAlerts();
        loadDashboard();
    } catch (e) {
        console.error('Failed to handle alert:', e);
    }
}

async function freezeUser(userId) {
    if (!confirm('确定要冻结该用户账户吗？')) return;

    try {
        await fetch(`${API_BASE}/users/${userId}/freeze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: '风控冻结' })
        });
        loadUsers();
    } catch (e) {
        console.error('Failed to freeze user:', e);
    }
}

async function unfreezeUser(userId) {
    if (!confirm('确定要解冻该用户账户吗？')) return;

    try {
        await fetch(`${API_BASE}/users/${userId}/unfreeze`, { method: 'POST' });
        loadUsers();
    } catch (e) {
        console.error('Failed to unfreeze user:', e);
    }
}

async function generateMockTxn() {
    try {
        await fetch(`${API_BASE}/dashboard/mock/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 10 })
        });
        loadDashboard();
    } catch (e) {
        console.error('Failed to generate mock transactions:', e);
    }
}

async function toggleMockGenerator() {
    const btnText = document.getElementById('mockBtnText');
    const isRunning = btnText.textContent.includes('停止');

    try {
        if (isRunning) {
            await fetch(`${API_BASE}/dashboard/mock/stop`, { method: 'POST' });
        } else {
            await fetch(`${API_BASE}/dashboard/mock/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionsPerMinute: 30 })
            });
        }
        loadDashboard();
    } catch (e) {
        console.error('Failed to toggle mock generator:', e);
    }
}

function showModal(title, bodyContent, footerContent) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyContent;
    document.getElementById('modalFooter').innerHTML = footerContent || '';
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal();
    }
});

function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

function formatAmount(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(timeStr) {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getRiskLevelText(level) {
    const map = {
        'CRITICAL': '严重',
        'HIGH': '高风险',
        'MEDIUM': '中风险',
        'LOW': '低风险'
    };
    return map[level] || level || '低风险';
}

function getSeverityText(severity) {
    const map = {
        'CRITICAL': '严重',
        'HIGH': '高',
        'MEDIUM': '中',
        'LOW': '低'
    };
    return map[severity] || severity || '低';
}

function getStatusText(status) {
    const map = {
        'APPROVED': '已通过',
        'REJECTED': '已拒绝',
        'PENDING': '待审核',
        'PROCESSING': '处理中'
    };
    return map[status] || status || '未知';
}

function getAlertStatusText(status) {
    const map = {
        'PENDING': '待处理',
        'HANDLED': '已处理',
        'DISMISSED': '已忽略'
    };
    return map[status] || status || '未知';
}

function getAccountTypeText(type) {
    const map = {
        'PERSONAL': '个人账户',
        'ENTERPRISE': '企业账户',
        'VIP': 'VIP账户'
    };
    return map[type] || type || '个人账户';
}

function getAccountStatusText(status) {
    const map = {
        'ACTIVE': '正常',
        'FROZEN': '已冻结',
        'CLOSED': '已注销'
    };
    return map[status] || status || '未知';
}

function getBlacklistTypeText(type) {
    const map = {
        'IP': 'IP地址',
        'CARD': '卡号',
        'ACCOUNT': '账户',
        'USER': '用户',
        'MERCHANT': '商户',
        'DEVICE': '设备'
    };
    return map[type] || type || '其他';
}

function getRiskColor(level) {
    const map = {
        'CRITICAL': '#dc2626',
        'HIGH': '#ef4444',
        'MEDIUM': '#f59e0b',
        'LOW': '#22c55e'
    };
    return map[level] || '#22c55e';
}

let currentTraceTxnId = null;

function loadFraudPatternStats() {
    fetch(API_BASE + '/fraud-pattern/stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('statStolenCard').textContent = formatNumber(data.stolenCardCount || 0);
            document.getElementById('statCashOut').textContent = formatNumber(data.cashOutCount || 0);
            document.getElementById('statFakeTxn').textContent = formatNumber(data.fakeTransactionCount || 0);
            document.getElementById('statTakeover').textContent = formatNumber(0);
        })
        .catch(e => console.error('Failed to load fraud pattern stats:', e));
}

function queryTraceability() {
    const txnId = document.getElementById('traceTxnId').value.trim();
    if (!txnId) {
        alert('请输入交易ID');
        return;
    }
    currentTraceTxnId = txnId;

    Promise.all([
        fetch(`${API_BASE}/traceability/${txnId}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/fraud-pattern/transaction/${txnId}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/audit/transaction/${txnId}`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/transactions/${txnId}`).then(r => r.ok ? r.json() : null)
    ]).then(([trace, pattern, audits, txn]) => {
        document.getElementById('tracePlaceholder').style.display = 'none';
        document.getElementById('traceResultCard').style.display = 'block';
        renderTraceContent(trace, pattern, audits, txn);
    }).catch(e => {
        console.error('Trace query failed:', e);
        alert('查询失败，请检查交易ID是否正确');
    });
}

function renderTraceContent(trace, pattern, audits, txn) {
    let html = '';

    if (txn) {
        html += `
            <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px;">
                <h4 style="margin-bottom:12px;color:#111827;">📋 交易基本信息</h4>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:13px;">
                    <div><span style="color:#6b7280;">交易ID:</span> <strong>${txn.transactionId}</strong></div>
                    <div><span style="color:#6b7280;">用户ID:</span> ${txn.userId}</div>
                    <div><span style="color:#6b7280;">金额:</span> <strong style="color:#ef4444;">¥${formatAmount(txn.amount)}</strong></div>
                    <div><span style="color:#6b7280;">状态:</span> <span class="status-badge status-${(txn.status || 'pending').toLowerCase()}">${getStatusText(txn.status)}</span></div>
                    <div><span style="color:#6b7280;">风险评分:</span> <strong style="color:${getRiskColor(txn.riskLevel)};">${txn.riskScore || 0}分</strong></div>
                    <div><span style="color:#6b7280;">风险等级:</span> <span class="risk-badge risk-${(txn.riskLevel || 'low').toLowerCase()}">${getRiskLevelText(txn.riskLevel)}</span></div>
                    <div><span style="color:#6b7280;">商户:</span> ${txn.merchant || '-'}</div>
                    <div><span style="color:#6b7280;">创建时间:</span> ${formatTime(txn.createdAt)}</div>
                </div>
            </div>
        `;
    }

    if (trace) {
        html += `
            <div style="margin-bottom:24px;">
                <h4 style="margin-bottom:12px;color:#111827;">🔗 决策链路</h4>
                <div style="padding:12px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:13px;color:#1e40af;line-height:1.8;">
                    ${trace.decisionChain || '无决策链路信息'}
                </div>
            </div>
        `;

        if (trace.ruleTriggerHistory) {
            html += `
                <div style="margin-bottom:24px;">
                    <h4 style="margin-bottom:12px;color:#111827;">📋 规则触发历史</h4>
                    <div style="padding:12px 16px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-size:12px;color:#92400e;line-height:1.8;white-space:pre-wrap;font-family:monospace;max-height:200px;overflow-y:auto;">
                        ${trace.ruleTriggerHistory || '无规则触发'}
                    </div>
                </div>
            `;
        }

        if (trace.modelInferenceHistory) {
            html += `
                <div style="margin-bottom:24px;">
                    <h4 style="margin-bottom:12px;color:#111827;">🤖 模型推理历史</h4>
                    <div style="padding:12px 16px;background:#ede9fe;border:1px solid #c4b5fd;border-radius:8px;font-size:12px;color:#5b21b6;line-height:1.8;white-space:pre-wrap;font-family:monospace;max-height:200px;overflow-y:auto;">
                        ${trace.modelInferenceHistory || '无模型推理记录'}
                    </div>
                </div>
            `;
        }

        if (trace.evidenceChain) {
            html += `
                <div style="margin-bottom:24px;">
                    <h4 style="margin-bottom:12px;color:#111827;">🔍 证据链</h4>
                    <div style="padding:12px 16px;background:#fce7f3;border:1px solid #f9a8d4;border-radius:8px;font-size:13px;color:#9d174d;line-height:1.8;">
                        ${trace.evidenceChain || '无证据链信息'}
                    </div>
                </div>
            `;
        }

        if (trace.fullTraceLog) {
            html += `
                <div style="margin-bottom:24px;">
                    <h4 style="margin-bottom:12px;color:#111827;">📝 完整追踪日志</h4>
                    <div style="padding:12px 16px;background:#1f2937;border-radius:8px;font-size:12px;color:#d1d5db;line-height:1.8;white-space:pre-wrap;font-family:monospace;max-height:300px;overflow-y:auto;">
                        ${trace.fullTraceLog || '无追踪日志'}
                    </div>
                </div>
            `;
        }
    }

    if (pattern) {
        html += `
            <div style="margin-bottom:24px;">
                <h4 style="margin-bottom:12px;color:#111827;">🎯 机器学习欺诈模式检测</h4>
                <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px;">
                    <div style="text-align:center;padding:12px;background:${pattern.isStolenCard ? '#fef2f2' : '#f9fafb'};border-radius:8px;border:1px solid ${pattern.isStolenCard ? '#fecaca' : '#e5e7eb'};">
                        <div style="font-size:20px;font-weight:700;color:${pattern.isStolenCard ? '#dc2626' : '#6b7280'};">${pattern.stolenCardScore || 0}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">盗刷评分</div>
                        ${pattern.isStolenCard ? '<div style="font-size:11px;color:#dc2626;margin-top:4px;">⚠ 高风险</div>' : ''}
                    </div>
                    <div style="text-align:center;padding:12px;background:${pattern.isCashOut ? '#fffbeb' : '#f9fafb'};border-radius:8px;border:1px solid ${pattern.isCashOut ? '#fcd34d' : '#e5e7eb'};">
                        <div style="font-size:20px;font-weight:700;color:${pattern.isCashOut ? '#d97706' : '#6b7280'};">${pattern.cashOutScore || 0}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">套现评分</div>
                        ${pattern.isCashOut ? '<div style="font-size:11px;color:#d97706;margin-top:4px;">⚠ 高风险</div>' : ''}
                    </div>
                    <div style="text-align:center;padding:12px;background:${pattern.isFakeTransaction ? '#fffbeb' : '#f9fafb'};border-radius:8px;border:1px solid ${pattern.isFakeTransaction ? '#fcd34d' : '#e5e7eb'};">
                        <div style="font-size:20px;font-weight:700;color:${pattern.isFakeTransaction ? '#d97706' : '#6b7280'};">${pattern.fakeTransactionScore || 0}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">虚假交易</div>
                        ${pattern.isFakeTransaction ? '<div style="font-size:11px;color:#d97706;margin-top:4px;">⚠ 高风险</div>' : ''}
                    </div>
                    <div style="text-align:center;padding:12px;background:${pattern.isAccountTakeover ? '#f5f3ff' : '#f9fafb'};border-radius:8px;border:1px solid ${pattern.isAccountTakeover ? '#c4b5fd' : '#e5e7eb'};">
                        <div style="font-size:20px;font-weight:700;color:${pattern.isAccountTakeover ? '#7c3aed' : '#6b7280'};">${pattern.accountTakeoverScore || 0}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">账户盗用</div>
                        ${pattern.isAccountTakeover ? '<div style="font-size:11px;color:#7c3aed;margin-top:4px;">⚠ 高风险</div>' : ''}
                    </div>
                    <div style="text-align:center;padding:12px;background:${pattern.isMoneyLaundering ? '#ecfeff' : '#f9fafb'};border-radius:8px;border:1px solid ${pattern.isMoneyLaundering ? '#67e8f9' : '#e5e7eb'};">
                        <div style="font-size:20px;font-weight:700;color:${pattern.isMoneyLaundering ? '#0891b2' : '#6b7280'};">${pattern.moneyLaunderingScore || 0}</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:4px;">洗钱评分</div>
                        ${pattern.isMoneyLaundering ? '<div style="font-size:11px;color:#0891b2;margin-top:4px;">⚠ 高风险</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    if (audits && audits.length > 0) {
        html += `
            <div>
                <h4 style="margin-bottom:12px;color:#111827;">📊 审计追踪记录 (${audits.length}条)</h4>
                <div class="table-container">
                    <table class="data-table" style="font-size:12px;">
                        <thead>
                            <tr>
                                <th>操作时间</th>
                                <th>操作类型</th>
                                <th>操作结果</th>
                                <th>操作人</th>
                                <th>角色</th>
                                <th>详情</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${audits.map(a => `
                                <tr>
                                    <td>${formatTime(a.actionTime)}</td>
                                    <td><span style="padding:2px 8px;background:#e0e7ff;color:#3730a3;border-radius:4px;font-size:11px;">${a.actionType || '-'}</span></td>
                                    <td>${a.actionResult || '-'}</td>
                                    <td>${a.operatorName || '-'}</td>
                                    <td>${a.operatorRole || '-'}</td>
                                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${a.actionDetail || ''}">${a.actionDetail || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    if (!trace && !pattern && (!audits || audits.length === 0) && !txn) {
        html = '<div style="text-align:center;padding:40px;color:#9ca3af;"><div style="font-size:48px;margin-bottom:16px;">📭</div><p>未找到该交易的溯源信息</p></div>';
    }

    document.getElementById('traceContent').innerHTML = html;
}

function showTraceReport() {
    if (!currentTraceTxnId) {
        alert('请先查询交易溯源');
        return;
    }
    window.open(`${API_BASE}/traceability/${currentTraceTxnId}/report`, '_blank');
}

const originalSwitchPage = switchPage;
switchPage = function(page) {
    const titles = {
        dashboard: '监控仪表盘',
        transactions: '交易监控',
        alerts: '风险告警',
        rules: '规则引擎管理',
        users: '用户管理',
        blacklist: '黑名单管理',
        'fraud-patterns': '欺诈模式识别',
        traceability: '交易溯源追踪'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === page) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
        pageEl.classList.add('active');
    }

    if (page === 'transactions') {
        loadTransactions();
    } else if (page === 'alerts') {
        loadAlerts();
    } else if (page === 'rules') {
        loadRules();
    } else if (page === 'users') {
        loadUsers();
    } else if (page === 'blacklist') {
        loadBlacklist();
    } else if (page === 'fraud-patterns') {
        loadFraudPatternStats();
    }
};

