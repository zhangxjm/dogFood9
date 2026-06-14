var App = (function() {
    var currentPage = 'digital-twin';
    var ws = null;
    var wsReconnectTimer = null;
    var realtimeData = null;

    function init() {
        initNavigation();
        initWebSocket();
        initClock();
        loadDashboardStats();
        initCurrentPage();
        setInterval(loadDashboardStats, 5000);
    }

    function initNavigation() {
        var btns = document.querySelectorAll('.nav-btn');
        btns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                btns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var page = btn.getAttribute('data-page');
                switchPage(page);
            });
        });
    }

    function switchPage(pageName) {
        var pages = document.querySelectorAll('.page');
        pages.forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById('page-' + pageName);
        if (target) {
            target.classList.add('active');
        }
        currentPage = pageName;
        initCurrentPage();
    }

    var pageInitialized = {};

    function initCurrentPage() {
        if (pageInitialized[currentPage]) return;
        pageInitialized[currentPage] = true;

        switch(currentPage) {
            case 'digital-twin':
                if (typeof DigitalTwin !== 'undefined') DigitalTwin.init();
                break;
            case 'monitoring':
                if (typeof Monitoring !== 'undefined') Monitoring.init();
                break;
            case 'warning':
                if (typeof Warning !== 'undefined') Warning.init();
                break;
            case 'evacuation':
                if (typeof Evacuation !== 'undefined') Evacuation.init();
                break;
            case 'report':
                if (typeof Report !== 'undefined') Report.init();
                break;
            case 'planning':
                if (typeof Planning !== 'undefined') Planning.init();
                break;
            case 'flink':
                if (typeof FlinkManager !== 'undefined') FlinkManager.init();
                break;
        }
    }

    function initWebSocket() {
        var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        var wsUrl = protocol + '//' + location.host + '/ws/realtime';
        try {
            ws = new WebSocket(wsUrl);
            ws.onopen = function() {
                console.log('WebSocket connected');
            };
            ws.onmessage = function(event) {
                try {
                    realtimeData = JSON.parse(event.data);
                    updateRealtimeDisplay(realtimeData);
                } catch(e) {}
            };
            ws.onclose = function() {
                wsReconnectTimer = setTimeout(initWebSocket, 3000);
            };
            ws.onerror = function() {};
        } catch(e) {
            wsReconnectTimer = setTimeout(initWebSocket, 5000);
        }
    }

    function updateRealtimeDisplay(data) {
        if (!data) return;

        if (data.personnel) {
            var underground = data.personnel.filter(function(p) { return p.zone !== 'surface'; }).length;
            var el = document.getElementById('stat-underground');
            if (el) el.textContent = underground;
        }

        if (data.warnings) {
            var el2 = document.getElementById('stat-warnings');
            if (el2) el2.textContent = data.warnings.length;
        }

        if (data.ventilation) {
            var running = data.ventilation.filter(function(v) { return v.running; }).length;
            var total = data.ventilation.length;
            var el3 = document.getElementById('stat-ventilation');
            if (el3) el3.textContent = running + '/' + total;
        }
    }

    function initClock() {
        function update() {
            var now = new Date();
            var str = now.getFullYear() + '-' +
                String(now.getMonth()+1).padStart(2,'0') + '-' +
                String(now.getDate()).padStart(2,'0') + ' ' +
                String(now.getHours()).padStart(2,'0') + ':' +
                String(now.getMinutes()).padStart(2,'0') + ':' +
                String(now.getSeconds()).padStart(2,'0');
            var el = document.getElementById('system-time');
            if (el) el.textContent = str;
        }
        update();
        setInterval(update, 1000);
    }

    function loadDashboardStats() {
        fetch('/api/dashboard/stats')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var el1 = document.getElementById('stat-underground');
                if (el1) el1.textContent = data.underground_personnel;
                var el2 = document.getElementById('stat-warnings');
                if (el2) el2.textContent = data.active_warnings;
                var el3 = document.getElementById('stat-ventilation');
                if (el3) el3.textContent = data.ventilation_running + '/' + data.ventilation_total;
            })
            .catch(function() {});
    }

    function notify(message, type) {
        type = type || 'info';
        var container = document.getElementById('notification-container');
        if (!container) return;

        var icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        var notif = document.createElement('div');
        notif.className = 'notification ' + type;
        notif.innerHTML = '<span>' + (icons[type] || 'ℹ') + '</span><span>' + message + '</span>';
        container.appendChild(notif);

        setTimeout(function() {
            notif.style.opacity = '0';
            notif.style.transform = 'translateX(100%)';
            notif.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (notif.parentNode) notif.parentNode.removeChild(notif);
            }, 300);
        }, 3000);
    }

    return {
        init: init,
        notify: notify,
        getRealtimeData: function() { return realtimeData; },
        getCurrentPage: function() { return currentPage; }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
