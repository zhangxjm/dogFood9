var Monitoring = (function () {
    var charts = { gasChart: null, roofChart: null, ventChart: null, personnelChart: null };
    var refreshInterval;
    var currentZone = "";

    var STATUS_COLORS = {
        normal: "#66bb6a",
        warning: "#ff9800",
        critical: "#ef5350"
    };

    var CHART_DEFAULTS = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: "#e8eaf6", font: { size: 12 } }
            }
        },
        scales: {
            x: {
                ticks: { color: "#9fa8da", font: { size: 11 } },
                grid: { color: "rgba(42, 48, 112, 0.5)" }
            },
            y: {
                ticks: { color: "#9fa8da", font: { size: 11 } },
                grid: { color: "rgba(42, 48, 112, 0.5)" }
            }
        }
    };

    function init() {
        var gasCtx = document.getElementById("gas-chart");
        var roofCtx = document.getElementById("roof-chart");
        var ventCtx = document.getElementById("vent-chart");
        var personnelCtx = document.getElementById("personnel-chart");

        charts.gasChart = new Chart(gasCtx, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "瓦斯浓度", data: [], backgroundColor: [] }] },
            options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
        });

        charts.roofChart = new Chart(roofCtx, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "顶板应力", data: [], backgroundColor: [] }] },
            options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
        });

        charts.ventChart = new Chart(ventCtx, {
            type: "doughnut",
            data: {
                labels: ["运行中", "已停止"],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ["#66bb6a", "#ef5350"],
                    borderColor: ["#4caf50", "#d32f2f"],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: "#e8eaf6", font: { size: 12 } }
                    }
                }
            }
        });

        charts.personnelChart = new Chart(personnelCtx, {
            type: "bar",
            data: { labels: [], datasets: [{ label: "人员数量", data: [], backgroundColor: "#42a5f5" }] },
            options: JSON.parse(JSON.stringify(CHART_DEFAULTS))
        });

        refresh();
        refreshInterval = setInterval(refresh, 5000);
    }

    function refresh() {
        fetchGasSensors();
        fetchRoofSensors();
        fetchVentilation();
        fetchPersonnel();
    }

    function fetchGasSensors() {
        var url = "/api/monitoring/gas-sensors";
        if (currentZone) url += "?zone=" + encodeURIComponent(currentZone);
        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            if (!Array.isArray(data)) data = data.sensors || [];
            var labels = [], values = [], colors = [];
            var html = "";
            data.forEach(function (s) {
                labels.push(s.name);
                values.push(s.value);
                colors.push(STATUS_COLORS[s.status] || STATUS_COLORS.normal);
                html += '<div class="sensor-item">' +
                    '<span class="sensor-name">' + s.name + '</span>' +
                    '<span class="sensor-value ' + s.status + '">' + s.value + ' ' + (s.unit || "%") + '</span>' +
                    '</div>';
            });
            charts.gasChart.data.labels = labels;
            charts.gasChart.data.datasets[0].data = values;
            charts.gasChart.data.datasets[0].backgroundColor = colors;
            charts.gasChart.update();
            var list = document.getElementById("gas-sensor-list");
            if (list) list.innerHTML = html;
        }).catch(function () {});
    }

    function fetchRoofSensors() {
        var url = "/api/monitoring/roof-sensors";
        if (currentZone) url += "?zone=" + encodeURIComponent(currentZone);
        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            if (!Array.isArray(data)) data = data.sensors || [];
            var labels = [], values = [], colors = [];
            var html = "";
            data.forEach(function (s) {
                labels.push(s.name);
                values.push(s.value);
                colors.push(STATUS_COLORS[s.status] || STATUS_COLORS.normal);
                html += '<div class="sensor-item">' +
                    '<span class="sensor-name">' + s.name + '</span>' +
                    '<span class="sensor-value ' + s.status + '">' + s.value + ' ' + (s.unit || "MPa") + '</span>' +
                    '</div>';
            });
            charts.roofChart.data.labels = labels;
            charts.roofChart.data.datasets[0].data = values;
            charts.roofChart.data.datasets[0].backgroundColor = colors;
            charts.roofChart.update();
            var list = document.getElementById("roof-sensor-list");
            if (list) list.innerHTML = html;
        }).catch(function () {});
    }

    function fetchVentilation() {
        var url = "/api/monitoring/ventilation";
        if (currentZone) url += "?zone=" + encodeURIComponent(currentZone);
        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            if (!Array.isArray(data)) data = data.equipment || [];
            var running = 0, stopped = 0;
            var html = "";
            data.forEach(function (v) {
                if (v.running) running++; else stopped++;
                var statusClass = v.running ? "normal" : "critical";
                var statusText = v.running ? "运行中" : "已停止";
                html += '<div class="sensor-item">' +
                    '<span class="sensor-name">' + v.name + '</span>' +
                    '<span class="sensor-value ' + statusClass + '">' + statusText + '</span>' +
                    '</div>';
            });
            charts.ventChart.data.datasets[0].data = [running, stopped];
            charts.ventChart.update();
            var list = document.getElementById("vent-equip-list");
            if (list) list.innerHTML = html;
        }).catch(function () {});
    }

    function fetchPersonnel() {
        var url = "/api/monitoring/personnel";
        if (currentZone) url += "?zone=" + encodeURIComponent(currentZone);
        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            if (!Array.isArray(data)) data = data.zones || [];
            var labels = [], values = [];
            var html = "";
            data.forEach(function (z) {
                labels.push(z.zone || z.name);
                values.push(z.count);
                html += '<div class="sensor-item">' +
                    '<span class="sensor-name">' + (z.zone || z.name) + '</span>' +
                    '<span class="sensor-value normal">' + z.count + ' 人</span>' +
                    '</div>';
            });
            charts.personnelChart.data.labels = labels;
            charts.personnelChart.data.datasets[0].data = values;
            charts.personnelChart.update();
            var list = document.getElementById("personnel-zone-list");
            if (list) list.innerHTML = html;
        }).catch(function () {});
    }

    function filterZone(zone) {
        currentZone = zone;
        refresh();
    }

    function destroy() {
        if (refreshInterval) clearInterval(refreshInterval);
        if (charts.gasChart) { charts.gasChart.destroy(); charts.gasChart = null; }
        if (charts.roofChart) { charts.roofChart.destroy(); charts.roofChart = null; }
        if (charts.ventChart) { charts.ventChart.destroy(); charts.ventChart = null; }
        if (charts.personnelChart) { charts.personnelChart.destroy(); charts.personnelChart = null; }
    }

    return {
        get gasChart() { return charts.gasChart; },
        get roofChart() { return charts.roofChart; },
        get ventChart() { return charts.ventChart; },
        get personnelChart() { return charts.personnelChart; },
        init: init,
        refresh: refresh,
        filterZone: filterZone,
        destroy: destroy
    };
})();
