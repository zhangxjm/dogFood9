function showModal(id) {
    document.getElementById(id).classList.add('active');
}

function hideModal(id) {
    document.getElementById(id).classList.remove('active');
}

function openRequestModal(catalogId, catalogName) {
    document.getElementById('data_catalog_id').value = catalogId;
    document.getElementById('catalog_name_display').textContent = catalogName;
    showModal('requestModal');
}

function submitRequest() {
    const form = document.getElementById('requestForm');
    const formData = new URLSearchParams();
    
    for (const pair of new FormData(form)) {
        formData.append(pair[0], pair[1]);
    }

    fetch('/permission/requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    }).then(response => {
        window.location.reload();
    });
}

function requestData(catalogId, catalogName) {
    if (!confirm('确定要申请获取【' + catalogName + '】的数据吗？')) {
        return;
    }

    fetch('/exchange', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data_catalog_id: catalogId,
            exchange_type: 'read'
        })
    }).then(response => response.json())
      .then(data => {
          if (data.code === 200) {
              alert('数据交换请求已提交，请求ID：' + data.data.request_id);
          } else {
              alert('操作失败：' + data.message);
          }
      });
}

function previewData(catalogId) {
    window.location.href = '/exchange/preview/' + catalogId;
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
