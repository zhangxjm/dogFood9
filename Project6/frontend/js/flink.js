var FlinkManager = (function() {
    var clusterStatus = null;
    var refreshInterval = null;

    var STATUS_MAP = {
        running: '运行中',
        pending: '等待中',
        submitted_locally: '本地提交',
        stopped: '已停止',
        canceled: '已取消',
        finished: '已完成',
        failed: '失败'
    };

    function init() {
        checkStatus();
        loadJobs();
        refreshInterval = setInterval(function() {
            loadJobs();
        }, 10000);
    }

    function checkStatus() {
        fetch('/api/flink/status')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                clusterStatus = data;
                renderClusterStatus(data);
            })
            .catch(function(e) {
                renderClusterStatus({ status: 'unreachable', error: e.message });
            });
    }

    function renderClusterStatus(data) {
        var container = document.getElementById('flink-cluster-status');
        if (!container) return;

        var items = [];
        if (data.status === 'running' || data.status === 'healthy') {
            items.push({ label: '集群状态', value: '运行中', cls: 'running' });
            if (data.flink_version) items.push({ label: 'Flink版本', value: data.flink_version, cls: '' });
            if (data.taskmanagers) items.push({ label: 'TaskManager数', value: data.taskmanagers, cls: '' });
        } else {
            items.push({ label: '集群状态', value: '未连接', cls: 'stopped' });
            if (data.error) items.push({ label: '错误信息', value: data.error, cls: 'stopped' });
        }

        container.innerHTML = items.map(function(item) {
            return '<div class="flink-status-item">' +
                '<span class="label">' + item.label + '</span>' +
                '<span class="value ' + item.cls + '">' + item.value + '</span>' +
                '</div>';
        }).join('');
    }

    function loadJobs() {
        fetch('/api/flink/jobs')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                renderJobs(data);
            })
            .catch(function() {});
    }

    function renderJobs(data) {
        var container = document.getElementById('flink-jobs-list');
        if (!container) return;

        var jobs = data.database_jobs || data.db_jobs || data.jobs || [];
        if (jobs.length === 0) {
            container.innerHTML = '<p class="placeholder-text">暂无Flink任务</p>';
            return;
        }

        container.innerHTML = jobs.map(function(job) {
            var statusCls = job.status === 'running' ? 'running' : 'stopped';
            var statusText = STATUS_MAP[job.status] || job.status || '未知';
            return '<div class="flink-job-item" onclick="FlinkManager.showJobDetail(' + job.id + ')">' +
                '<div class="fji-name">' + (job.job_name || '未命名任务') + '</div>' +
                '<div class="fji-type">' +
                '<span>类型: ' + (job.job_type === 'streaming' ? '流式处理' : '批处理') + '</span>' +
                '<span class="value ' + statusCls + '" style="margin-left:8px">' + statusText + '</span>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function showJobDetail(jobId) {
        var container = document.getElementById('flink-job-detail');
        if (!container) return;

        fetch('/api/flink/jobs')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var jobs = data.database_jobs || data.db_jobs || data.jobs || [];
                var job = jobs.find(function(j) { return j.id === jobId; });
                if (!job) {
                    container.innerHTML = '<p class="placeholder-text">任务不存在</p>';
                    return;
                }

                var statusText = STATUS_MAP[job.status] || job.status || '未知';
                var statusCls = job.status === 'running' ? 'running' : 'stopped';

                var html = '<div style="margin-bottom:16px">';
                html += '<div style="margin-bottom:8px"><strong>任务名称:</strong> ' + job.job_name + '</div>';
                html += '<div style="margin-bottom:8px"><strong>任务类型:</strong> ' + (job.job_type === 'streaming' ? '流式处理' : '批处理') + '</div>';
                html += '<div style="margin-bottom:8px"><strong>状态:</strong> <span class="value ' + statusCls + '">' + statusText + '</span></div>';
                html += '<div style="margin-bottom:8px"><strong>Job ID:</strong> ' + (job.job_id || '未分配') + '</div>';
                html += '<div style="margin-bottom:8px"><strong>提交时间:</strong> ' + (job.submitted_at || '-') + '</div>';
                html += '<div style="margin-bottom:8px"><strong>最后检查:</strong> ' + (job.last_check || '-') + '</div>';
                html += '</div>';

                html += '<div style="margin-top:12px">';
                html += '<button class="btn btn-sm" onclick="FlinkManager.checkJobStatus(\'' + job.job_id + '\')">查询Flink状态</button>';
                if (job.status === 'running' && job.job_id) {
                    html += ' <button class="btn btn-sm btn-danger" onclick="FlinkManager.cancelJob(\'' + job.job_id + '\')">取消任务</button>';
                }
                html += '</div>';

                container.innerHTML = html;
            })
            .catch(function() {
                container.innerHTML = '<p class="placeholder-text">加载失败</p>';
            });
    }

    function submitStream() {
        fetch('/api/flink/submit/stream', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                App.notify('流式任务已提交', 'success');
                loadJobs();
            })
            .catch(function(e) {
                App.notify('提交失败: ' + e.message, 'error');
            });
    }

    function submitBatch() {
        fetch('/api/flink/submit/batch', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                App.notify('批处理任务已提交', 'success');
                loadJobs();
            })
            .catch(function(e) {
                App.notify('提交失败: ' + e.message, 'error');
            });
    }

    function checkJobStatus(flinkJobId) {
        if (!flinkJobId) {
            App.notify('无Flink Job ID', 'warning');
            return;
        }
        fetch('/api/flink/jobs/' + flinkJobId + '/status')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                App.notify('任务状态: ' + (data.state || data.status || '未知'), 'info');
            })
            .catch(function(e) {
                App.notify('查询失败: ' + e.message, 'error');
            });
    }

    function cancelJob(flinkJobId) {
        if (!flinkJobId) return;
        if (!confirm('确定要取消此任务吗？')) return;
        fetch('/api/flink/jobs/' + flinkJobId + '/cancel', { method: 'POST' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                App.notify('任务已取消', 'success');
                loadJobs();
            })
            .catch(function(e) {
                App.notify('取消失败: ' + e.message, 'error');
            });
    }

    return {
        init: init,
        checkStatus: checkStatus,
        submitStream: submitStream,
        submitBatch: submitBatch,
        showJobDetail: showJobDetail,
        checkJobStatus: checkJobStatus,
        cancelJob: cancelJob,
        loadJobs: loadJobs
    };
})();
