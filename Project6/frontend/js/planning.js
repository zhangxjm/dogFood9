var Planning = {
    refreshTimer: null,

    init: function () {
        this.loadPlans();
        this.loadZones();
        this.loadDashboard();
        this.refreshTimer = setInterval(function () {
            Planning.refresh();
        }, 10000);
    },

    refresh: function () {
        this.loadPlans();
        this.loadZones();
        this.loadDashboard();
    },

    loadDashboard: function () {
        fetch('/api/planning/dashboard')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                document.getElementById('plan-total').textContent = data.total || 0;
                document.getElementById('plan-active').textContent = data.active || 0;
                document.getElementById('plan-completed').textContent = data.completed || 0;
                Planning.initProgressChart(data);
            });
    },

    loadPlans: function () {
        fetch('/api/planning/plans')
            .then(function (res) { return res.json(); })
            .then(function (plans) {
                var container = document.getElementById('plan-list');
                container.innerHTML = '';
                plans.forEach(function (plan) {
                    var statusMap = {
                        planned: '已计划',
                        in_progress: '进行中',
                        completed: '已完成',
                        cancelled: '已取消'
                    };
                    var statusClass = 'pi-status pi-status-' + plan.status;
                    var progressPercent = Math.min((plan.actual_output / plan.target_output) * 100, 100);
                    if (isNaN(progressPercent)) progressPercent = 0;

                    var item = document.createElement('div');
                    item.className = 'plan-item';

                    var header = document.createElement('div');
                    header.className = 'pi-header';

                    var name = document.createElement('span');
                    name.className = 'pi-name';
                    name.textContent = plan.name;

                    var badge = document.createElement('span');
                    badge.className = statusClass;
                    badge.textContent = statusMap[plan.status] || plan.status;

                    header.appendChild(name);
                    header.appendChild(badge);

                    var progressWrap = document.createElement('div');
                    progressWrap.className = 'pi-progress';
                    var bar = document.createElement('div');
                    bar.className = 'pi-progress-bar';
                    bar.style.width = progressPercent + '%';
                    progressWrap.appendChild(bar);

                    var info = document.createElement('div');
                    info.className = 'pi-info';
                    info.textContent = '实际产量: ' + (plan.actual_output || 0) + ' / 目标产量: ' + (plan.target_output || 0);

                    var actions = document.createElement('div');
                    actions.className = 'pi-actions';

                    if (plan.status === 'planned') {
                        var btnStart = document.createElement('button');
                        btnStart.textContent = '开始';
                        btnStart.onclick = function () { Planning.updatePlanStatus(plan.id, 'in_progress'); };
                        actions.appendChild(btnStart);
                    }
                    if (plan.status === 'in_progress') {
                        var btnComplete = document.createElement('button');
                        btnComplete.textContent = '完成';
                        btnComplete.onclick = function () { Planning.updatePlanStatus(plan.id, 'completed'); };
                        actions.appendChild(btnComplete);

                        var btnUpdate = document.createElement('button');
                        btnUpdate.textContent = '更新进度';
                        btnUpdate.onclick = function () {
                            var val = prompt('请输入实际产量:', plan.actual_output || 0);
                            if (val !== null) {
                                Planning.updatePlanProgress(plan.id, parseFloat(val));
                            }
                        };
                        actions.appendChild(btnUpdate);

                        var btnCancel = document.createElement('button');
                        btnCancel.textContent = '取消';
                        btnCancel.onclick = function () { Planning.updatePlanStatus(plan.id, 'cancelled'); };
                        actions.appendChild(btnCancel);
                    }

                    item.appendChild(header);
                    item.appendChild(progressWrap);
                    item.appendChild(info);
                    item.appendChild(actions);
                    container.appendChild(item);
                });
            });
    },

    loadZones: function () {
        fetch('/api/planning/zones')
            .then(function (res) { return res.json(); })
            .then(function (zones) {
                var container = document.getElementById('zone-list');
                container.innerHTML = '';
                zones.forEach(function (zone) {
                    var card = document.createElement('div');
                    card.className = 'zone-item-card';

                    var dot = document.createElement('span');
                    dot.className = 'zone-status-dot zone-status-dot-' + zone.status;

                    var nameEl = document.createElement('span');
                    nameEl.className = 'zone-name';
                    nameEl.textContent = zone.name;

                    var typeEl = document.createElement('span');
                    typeEl.className = 'zone-type';
                    typeEl.textContent = zone.type;

                    card.appendChild(dot);
                    card.appendChild(nameEl);
                    card.appendChild(typeEl);
                    container.appendChild(card);
                });
            });
    },

    showCreateForm: function () {
        document.getElementById('plan-create-modal').style.display = 'block';
        var select = document.getElementById('plan-zone');
        select.innerHTML = '';
        fetch('/api/planning/zones')
            .then(function (res) { return res.json(); })
            .then(function (zones) {
                zones.forEach(function (zone) {
                    var opt = document.createElement('option');
                    opt.value = zone.id;
                    opt.textContent = zone.name;
                    select.appendChild(opt);
                });
            });
    },

    hideCreateForm: function () {
        document.getElementById('plan-create-modal').style.display = 'none';
    },

    createPlan: function (event) {
        event.preventDefault();
        var form = event.target;
        var data = {
            name: form.querySelector('#plan-name').value,
            zone_id: form.querySelector('#plan-zone').value,
            target_output: parseFloat(form.querySelector('#plan-target').value),
            start_date: form.querySelector('#plan-start-date').value,
            end_date: form.querySelector('#plan-end-date').value
        };
        fetch('/api/planning/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(function (res) {
                if (res.ok) {
                    Planning.hideCreateForm();
                    App.notify('计划创建成功', 'success');
                    Planning.refresh();
                } else {
                    App.notify('计划创建失败', 'error');
                }
            });
    },

    updatePlanStatus: function (planId, status) {
        fetch('/api/planning/plans/' + planId + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        })
            .then(function (res) {
                if (res.ok) {
                    App.notify('状态更新成功', 'success');
                    Planning.refresh();
                } else {
                    App.notify('状态更新失败', 'error');
                }
            });
    },

    updatePlanProgress: function (planId, actualOutput) {
        fetch('/api/planning/plans/' + planId + '/progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_output: actualOutput })
        })
            .then(function (res) {
                if (res.ok) {
                    App.notify('进度更新成功', 'success');
                    Planning.refresh();
                } else {
                    App.notify('进度更新失败', 'error');
                }
            });
    },

    initProgressChart: function (dashboardData) {
        if (!dashboardData) return;
        var ctx = document.getElementById('plan-progress-chart');
        if (!ctx) return;

        fetch('/api/planning/plans')
            .then(function (res) { return res.json(); })
            .then(function (plans) {
                var labels = plans.map(function (p) { return p.name; });
                var targetData = plans.map(function (p) { return p.target_output || 0; });
                var actualData = plans.map(function (p) { return p.actual_output || 0; });

                if (Planning.progressChart) {
                    Planning.progressChart.destroy();
                }

                Planning.progressChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '目标产量',
                                data: targetData,
                                backgroundColor: 'rgba(54, 162, 235, 0.6)'
                            },
                            {
                                label: '实际产量',
                                data: actualData,
                                backgroundColor: 'rgba(75, 192, 192, 0.6)'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: { beginAtZero: true }
                        },
                        plugins: {
                            legend: { position: 'top' }
                        }
                    }
                });
            });
    }
};
