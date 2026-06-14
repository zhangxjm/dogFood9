var DigitalTwin = (function () {
    var scene, camera, renderer, container, raycaster, mouse, clock;
    var animationId, fetchInterval, focusAnim = null;
    var zones = {}, personnelMeshes = {}, sensorMeshes = {}, fanMeshes = {};
    var labels = [], labelsVisible = true;
    var INITIAL_CAM = new THREE.Vector3(125, 80, -80);
    var INITIAL_TARGET = new THREE.Vector3(125, 0, -50);
    var orbitTarget = new THREE.Vector3(125, 0, -50);
    var spherical = new THREE.Spherical();
    var isDragging = false, prevMouse = { x: 0, y: 0 };
    var onMouseDown, onMouseMove, onMouseUp, onWheel, onClick, onResizeHandler;

    var ZONES = [
        { id: "Z001", name: "主井通道", type: "normal", from: [0,0,0], to: [50,5,5] },
        { id: "Z002", name: "1号运输巷", type: "normal", from: [50,0,-50], to: [200,5,-45] },
        { id: "Z003", name: "2号运输巷", type: "normal", from: [50,0,-55], to: [200,5,-60] },
        { id: "Z004", name: "采煤工作面A", type: "workface", from: [200,0,-60], to: [250,5,-40] },
        { id: "Z005", name: "采煤工作面B", type: "workface", from: [200,0,-40], to: [250,5,-20] },
        { id: "Z006", name: "通风巷道", type: "ventilation", from: [0,5,-50], to: [250,8,-45] },
        { id: "Z007", name: "中央变电所", type: "other", from: [100,0,-70], to: [120,5,-60] },
        { id: "Z008", name: "水泵房", type: "other", from: [80,0,-75], to: [100,5,-65] },
        { id: "Z009", name: "3号运输巷", type: "normal", from: [50,-5,-55], to: [200,0,-50] },
        { id: "Z010", name: "避难硐室", type: "refuge", from: [150,0,-70], to: [170,5,-60] }
    ];
    var TYPE_COLORS = {
        normal: { fill: 0x1a3a1a, wire: 0x4caf50 }, workface: { fill: 0x3a2a1a, wire: 0xff9800 },
        ventilation: { fill: 0x1a2a3a, wire: 0x2196f3 }, refuge: { fill: 0x2a1a3a, wire: 0x9c27b0 },
        other: { fill: 0x2a2a3a, wire: 0x9e9e9e }
    };
    var P_COLORS = { normal: 0x2196f3, danger: 0xf44336, evacuating: 0x9c27b0, evacuated: 0x9c27b0 };
    var S_COLORS = { normal: 0x4caf50, warning: 0xff9800, critical: 0xf44336 };

    function init() {
        container = document.getElementById("dt-viewer");
        if (!container) return;
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0e27);
        camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.copy(INITIAL_CAM);
        camera.lookAt(INITIAL_TARGET);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);
        spherical.setFromVector3(new THREE.Vector3().subVectors(INITIAL_CAM, INITIAL_TARGET));
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        clock = new THREE.Clock();
        scene.add(new THREE.AmbientLight(0x334466, 0.5));
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 100, 50);
        scene.add(dirLight);
        var grid = new THREE.GridHelper(300, 30, 0x1a2a4a, 0x0d1530);
        grid.position.set(125, -0.01, -37);
        scene.add(grid);
        buildZones();
        setupOrbitControls();
        setupRaycaster();
        onResizeHandler = onResize;
        window.addEventListener("resize", onResizeHandler);
        fetchSceneData();
        fetchInterval = setInterval(fetchSceneData, 3000);
        animate();
    }

    function buildZones() {
        ZONES.forEach(function (z) {
            var w = Math.abs(z.to[0] - z.from[0]), h = Math.abs(z.to[1] - z.from[1]), d = Math.abs(z.to[2] - z.from[2]);
            var cx = (z.from[0] + z.to[0]) / 2, cy = (z.from[1] + z.to[1]) / 2, cz = (z.from[2] + z.to[2]) / 2;
            var colors = TYPE_COLORS[z.type] || TYPE_COLORS.other;
            var mat = new THREE.MeshPhongMaterial({ color: colors.fill, transparent: true, opacity: 0.6 });
            var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.position.set(cx, cy, cz);
            mesh.userData = { zoneId: z.id, zoneName: z.name };
            scene.add(mesh);
            var wireMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: colors.wire, wireframe: true }));
            wireMesh.position.set(cx, cy, cz);
            scene.add(wireMesh);
            var label = createSpriteLabel(z.name, cx, h / 2 + cy + 2, cz);
            labels.push(label);
            scene.add(label);
            zones[z.id] = { mesh: mesh, wire: wireMesh, label: label, data: z };
        });
        var sel = document.getElementById("dt-zone-select");
        if (sel) ZONES.forEach(function (z) {
            var opt = document.createElement("option");
            opt.value = z.id; opt.textContent = z.name; sel.appendChild(opt);
        });
    }

    function createSpriteLabel(text, x, y, z) {
        var canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 64;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text, 128, 32);
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.position.set(x, y, z);
        sprite.scale.set(12, 3, 1);
        return sprite;
    }

    function setupOrbitControls() {
        var el = renderer.domElement;
        onMouseDown = function (e) { isDragging = true; prevMouse.x = e.clientX; prevMouse.y = e.clientY; };
        onMouseMove = function (e) {
            if (!isDragging) return;
            var dx = e.clientX - prevMouse.x, dy = e.clientY - prevMouse.y;
            prevMouse.x = e.clientX; prevMouse.y = e.clientY;
            spherical.theta -= dx * 0.005;
            spherical.phi -= dy * 0.005;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
            updateCam();
        };
        onMouseUp = function () { isDragging = false; };
        onWheel = function (e) {
            e.preventDefault();
            spherical.radius += e.deltaY * 0.05;
            spherical.radius = Math.max(10, Math.min(300, spherical.radius));
            updateCam();
        };
        el.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        el.addEventListener("wheel", onWheel, { passive: false });
    }

    function updateCam() {
        camera.position.copy(orbitTarget).add(new THREE.Vector3().setFromSpherical(spherical));
        camera.lookAt(orbitTarget);
    }

    function setupRaycaster() {
        onClick = function (e) {
            var rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var meshes = Object.keys(zones).map(function (k) { return zones[k].mesh; });
            var hits = raycaster.intersectObjects(meshes);
            if (hits.length > 0 && hits[0].object.userData.zoneId) focusZone(hits[0].object.userData.zoneId);
        };
        renderer.domElement.addEventListener("click", onClick);
    }

    function fetchSceneData() {
        fetch("/api/digital-twin/scene").then(function (r) { return r.json(); }).then(function (data) {
            updatePersonnel(data.personnel || []);
            updateSensors(data.sensors || []);
            updateFans(data.ventilation || []);
            updateSceneInfo(data);
        }).catch(function () {});
    }

    function removeMeshAndLabel(mesh, label) {
        scene.remove(mesh);
        if (label) { scene.remove(label); var i = labels.indexOf(label); if (i > -1) labels.splice(i, 1); }
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
    }

    function updatePersonnel(personnel) {
        var cur = {};
        personnel.forEach(function (p) {
            cur[p.id] = true;
            if (personnelMeshes[p.id]) {
                var pm = personnelMeshes[p.id];
                pm.mesh.position.set(p.position.x, p.position.y, p.position.z);
                pm.light.position.set(p.position.x, p.position.y + 1, p.position.z);
                if (pm.label) pm.label.position.set(p.position.x, p.position.y + 2, p.position.z);
                pm.baseY = p.position.y;
                var c = P_COLORS[p.status] || P_COLORS.normal;
                pm.mesh.material.color.setHex(c); pm.mesh.material.emissive.setHex(c); pm.light.color.setHex(c);
                pm.status = p.status;
            } else { personnelMeshes[p.id] = createPersonnelMesh(p); }
        });
        Object.keys(personnelMeshes).forEach(function (id) {
            if (!cur[id]) { removeMeshAndLabel(personnelMeshes[id].mesh, personnelMeshes[id].label); scene.remove(personnelMeshes[id].light); delete personnelMeshes[id]; }
        });
    }

    function createPersonnelMesh(p) {
        var c = P_COLORS[p.status] || P_COLORS.normal;
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshPhongMaterial({ color: c, emissive: c, emissiveIntensity: 0.3 }));
        mesh.position.set(p.position.x, p.position.y, p.position.z);
        scene.add(mesh);
        var light = new THREE.PointLight(c, 0.5, 10);
        light.position.set(p.position.x, p.position.y + 1, p.position.z);
        scene.add(light);
        var label = createSpriteLabel(p.name || "人员", p.position.x, p.position.y + 2, p.position.z);
        label.scale.set(6, 1.5, 1); label.visible = labelsVisible;
        labels.push(label); scene.add(label);
        return { mesh: mesh, light: light, label: label, status: p.status, baseY: p.position.y };
    }

    function updateSensors(sensors) {
        var cur = {};
        sensors.forEach(function (s) {
            cur[s.id] = true;
            if (sensorMeshes[s.id]) {
                var sm = sensorMeshes[s.id];
                sm.mesh.position.set(s.position.x, s.position.y, s.position.z);
                if (sm.label) sm.label.position.set(s.position.x, s.position.y + 1.5, s.position.z);
                var c = S_COLORS[s.status] || S_COLORS.normal;
                sm.mesh.material.color.setHex(c); sm.mesh.material.emissive.setHex(c);
                sm.status = s.status;
                if (s.status !== "critical") { sm.mesh.material.emissiveIntensity = 0.3; sm.mesh.scale.setScalar(1); }
            } else { sensorMeshes[s.id] = createSensorMesh(s); }
        });
        Object.keys(sensorMeshes).forEach(function (id) {
            if (!cur[id]) { removeMeshAndLabel(sensorMeshes[id].mesh, sensorMeshes[id].label); delete sensorMeshes[id]; }
        });
    }

    function createSensorMesh(s) {
        var c = S_COLORS[s.status] || S_COLORS.normal;
        var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16), new THREE.MeshPhongMaterial({ color: c, emissive: c, emissiveIntensity: 0.3 }));
        mesh.position.set(s.position.x, s.position.y, s.position.z);
        scene.add(mesh);
        var label = createSpriteLabel(s.name || "传感器", s.position.x, s.position.y + 1.5, s.position.z);
        label.scale.set(6, 1.5, 1); label.visible = labelsVisible;
        labels.push(label); scene.add(label);
        return { mesh: mesh, label: label, status: s.status };
    }

    function updateFans(ventilation) {
        var cur = {};
        ventilation.forEach(function (v) {
            cur[v.id] = true;
            if (fanMeshes[v.id]) { fanMeshes[v.id].group.position.set(v.position.x, v.position.y, v.position.z); fanMeshes[v.id].running = v.running; }
            else { fanMeshes[v.id] = createFanMesh(v); }
        });
        Object.keys(fanMeshes).forEach(function (id) {
            if (!cur[id]) {
                var fm = fanMeshes[id];
                scene.remove(fm.group);
                if (fm.label) { scene.remove(fm.label); var i = labels.indexOf(fm.label); if (i > -1) labels.splice(i, 1); }
                fm.group.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
                delete fanMeshes[id];
            }
        });
    }

    function createFanMesh(v) {
        var group = new THREE.Group();
        var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16), new THREE.MeshPhongMaterial({ color: 0x666666 }));
        hub.rotation.x = Math.PI / 2;
        group.add(hub);
        for (var i = 0; i < 4; i++) {
            var blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 0.05), new THREE.MeshPhongMaterial({ color: 0x2196f3, transparent: true, opacity: 0.8 }));
            blade.rotation.z = (Math.PI / 2) * i;
            group.add(blade);
        }
        group.position.set(v.position.x, v.position.y, v.position.z);
        scene.add(group);
        var label = createSpriteLabel(v.name || "风机", v.position.x, v.position.y + 3, v.position.z);
        label.scale.set(6, 1.5, 1); label.visible = labelsVisible;
        labels.push(label); scene.add(label);
        return { group: group, label: label, running: v.running };
    }

    function updateSceneInfo(data) {
        var el = document.getElementById("dt-scene-info");
        if (!el) return;
        el.innerHTML = "<div>人员: " + (data.personnel || []).length + "</div><div>传感器: " + (data.sensors || []).length + "</div><div>通风设备: " + (data.ventilation || []).length + "</div><div>活跃预警: " + (data.warnings || []).length + "</div>";
        var zs = document.getElementById("dt-zone-status");
        if (zs && data.zones) zs.innerHTML = data.zones.map(function (z) {
            var statusText = z.status === "normal" ? "正常" : (z.status === "warning" ? "预警" : (z.status === "critical" ? "危险" : (z.status === "evacuating" ? "撤离中" : z.status)));
            return '<div class="zone-item"><span><span class="zone-status-dot ' + z.status + '"></span>' + z.name + '</span><span style="font-size:11px;color:#9fa8da">' + statusText + '</span></div>';
        }).join("");

        var ss = document.getElementById("dt-sensor-summary");
        if (ss && data.sensors) {
            var total = data.sensors.length;
            var normal = data.sensors.filter(function (s) { return s.status === "normal"; }).length;
            var warning = data.sensors.filter(function (s) { return s.status === "warning"; }).length;
            var critical = data.sensors.filter(function (s) { return s.status === "critical"; }).length;
            ss.innerHTML = '<div class="evac-info-item"><span class="evac-info-label">传感器总数</span><span class="evac-info-value">' + total + '</span></div>' +
                '<div class="evac-info-item"><span class="evac-info-label">正常</span><span class="evac-info-value" style="color:#66bb6a">' + normal + '</span></div>' +
                '<div class="evac-info-item"><span class="evac-info-label">预警</span><span class="evac-info-value" style="color:#ff9800">' + warning + '</span></div>' +
                '<div class="evac-info-item"><span class="evac-info-label">危险</span><span class="evac-info-value" style="color:#ef5350">' + critical + '</span></div>';
        }

        var lw = document.getElementById("dt-live-warnings");
        if (lw && data.warnings) {
            var wlist = data.warnings.slice(0, 10);
            if (wlist.length === 0) {
                lw.innerHTML = '<div style="color:#66bb6a;font-size:12px;padding:10px 0;text-align:center">暂无预警，运行正常</div>';
            } else {
                lw.innerHTML = wlist.map(function (w) {
                    var lvl = w.level === "critical" ? "critical" : "warning";
                    var lvlText = w.level === "critical" ? "危险" : "预警";
                    var wtypeText = w.warning_type === "gas" || w.warning_type === "gas_overlimit" ? "瓦斯" : (w.warning_type === "roof" || w.warning_type === "roof_stress" ? "顶板" : w.warning_type);
                    return '<div class="warning-mini-item"><span class="level-badge ' + lvl + '">' + lvlText + '</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (w.zone || "") + ' ' + wtypeText + ': ' + (w.value || 0).toFixed(1) + '</span></div>';
                }).join("");
            }
        }
    }

    function animate() {
        animationId = requestAnimationFrame(animate);
        var delta = clock.getDelta(), elapsed = clock.getElapsedTime();
        Object.keys(personnelMeshes).forEach(function (id) {
            var pm = personnelMeshes[id];
            pm.mesh.position.y = pm.baseY + Math.sin(elapsed * 2 + pm.baseY * 3) * 0.15;
            pm.light.position.y = pm.mesh.position.y + 1;
            if (pm.label) pm.label.position.y = pm.mesh.position.y + 2;
        });
        Object.keys(fanMeshes).forEach(function (id) { if (fanMeshes[id].running) fanMeshes[id].group.rotation.z += delta * 5; });
        Object.keys(sensorMeshes).forEach(function (id) {
            var sm = sensorMeshes[id];
            if (sm.status === "critical") {
                var pulse = (Math.sin(elapsed * 6) + 1) / 2;
                sm.mesh.material.emissiveIntensity = 0.3 + pulse * 0.7;
                sm.mesh.scale.setScalar(0.8 + pulse * 0.4);
            }
        });
        if (focusAnim) {
            focusAnim.progress += delta * 2;
            if (focusAnim.progress >= 1) {
                camera.position.copy(focusAnim.endPos);
                orbitTarget.copy(focusAnim.endTarget);
                spherical.setFromVector3(new THREE.Vector3().subVectors(focusAnim.endPos, focusAnim.endTarget));
                focusAnim = null;
            } else {
                var t = focusAnim.progress, ease = t * t * (3 - 2 * t);
                camera.position.lerpVectors(focusAnim.startPos, focusAnim.endPos, ease);
                orbitTarget.lerpVectors(focusAnim.startTarget, focusAnim.endTarget, ease);
                camera.lookAt(orbitTarget);
            }
        }
        renderer.render(scene, camera);
    }

    function resetCamera() {
        focusAnim = { startPos: camera.position.clone(), startTarget: orbitTarget.clone(), endPos: INITIAL_CAM.clone(), endTarget: INITIAL_TARGET.clone(), progress: 0 };
    }

    function toggleLabels() {
        labelsVisible = !labelsVisible;
        labels.forEach(function (l) { l.visible = labelsVisible; });
    }

    function focusZone(zoneId) {
        var zone = zones[zoneId];
        if (!zone) return;
        var center = zone.mesh.position.clone(), d = zone.data;
        var dist = Math.max((Math.abs(d.to[0] - d.from[0]) + Math.abs(d.to[2] - d.from[2])) * 0.6, 15);
        focusAnim = { startPos: camera.position.clone(), startTarget: orbitTarget.clone(), endPos: center.clone().add(new THREE.Vector3(dist * 0.5, dist * 0.6, dist * 0.5)), endTarget: center, progress: 0 };
    }

    function onResize() {
        if (!container || !camera || !renderer) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function destroy() {
        if (animationId) cancelAnimationFrame(animationId);
        if (fetchInterval) clearInterval(fetchInterval);
        window.removeEventListener("resize", onResizeHandler);
        if (renderer) {
            var el = renderer.domElement;
            el.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("click", onClick);
        }
        scene.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) { if (o.material.map) o.material.map.dispose(); if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); }); else o.material.dispose(); }
        });
        if (renderer && container && renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
        if (renderer) renderer.dispose();
        scene = null; camera = null; renderer = null; container = null;
        zones = {}; personnelMeshes = {}; sensorMeshes = {}; fanMeshes = {}; labels = []; focusAnim = null;
    }

    return { init: init, resetCamera: resetCamera, toggleLabels: toggleLabels, focusZone: focusZone, destroy: destroy };
})();
