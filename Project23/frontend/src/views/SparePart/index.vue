<template>
  <div class="sparepart-management">
    <div class="page-header">
      <h2 class="page-title">备件管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="库存管理" name="stock">
        <el-row :gutter="20" class="mb-20">
          <el-col :span="6">
            <StatCard title="备件种类" :value="stockStats.totalTypes || 0" icon="Box" bgColor="#ecf5ff" iconColor="#409EFF" />
          </el-col>
          <el-col :span="6">
            <StatCard title="库存总量" :value="stockStats.totalQuantity || 0" icon="Goods" bgColor="#f0f9eb" iconColor="#67C23A" />
          </el-col>
          <el-col :span="6">
            <StatCard title="库存预警" :value="stockStats.warningCount || 0" icon="Warning" bgColor="#fdf6ec" iconColor="#E6A23C" />
          </el-col>
          <el-col :span="6">
            <StatCard title="库存总价值" :value="stockStats.totalValue || '¥0'" icon="Money" bgColor="#fef0f0" iconColor="#F56C6C" />
          </el-col>
        </el-row>

        <div class="card-shadow mb-20" style="padding: 20px">
          <div class="flex-between mb-16">
            <el-form :inline="true" :model="stockSearch">
              <el-form-item label="备件名称">
                <el-input v-model="stockSearch.name" placeholder="请输入备件名称" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleStockSearch">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetStockSearch">
                  <el-icon><RefreshRight /></el-icon>
                  重置
                </el-button>
              </el-form-item>
            </el-form>
            <div>
              <el-button type="success" @click="openStockDialog('in')">
                <el-icon><Top /></el-icon>
                入库
              </el-button>
              <el-button type="warning" @click="openStockDialog('out')">
                <el-icon><Bottom /></el-icon>
                出库
              </el-button>
              <el-button type="primary" @click="openPartDialog">
                <el-icon><Plus /></el-icon>
                新增备件
              </el-button>
            </div>
          </div>

          <el-table :data="stockList" v-loading="stockLoading" style="width: 100%">
            <el-table-column prop="id" label="库存ID" width="80" />
            <el-table-column label="备件名称" width="150">
              <template #default="{ row }">{{ row.part?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="规格型号" width="150">
              <template #default="{ row }">{{ row.part?.spec || '-' }}</template>
            </el-table-column>
            <el-table-column label="单位" width="80">
              <template #default="{ row }">{{ row.part?.unit || '-' }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="库存数量" width="100">
              <template #default="{ row }">
                <span :class="{ 'low-stock': row.quantity <= row.min_stock }">{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="min_stock" label="最低库存" width="100" />
            <el-table-column prop="max_stock" label="最高库存" width="100" />
            <el-table-column label="单价(元)" width="100">
              <template #default="{ row }">{{ row.part?.unit_price ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="总价值(元)" width="120">
              <template #default="{ row }">¥{{ ((row.quantity || 0) * (row.part?.unit_price || 0)).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="warehouse" label="存放仓库" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.quantity <= row.min_stock ? 'danger' : 'success'" size="small">
                  {{ row.quantity <= row.min_stock ? '库存不足' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link @click="openStockDialog('in', row)">入库</el-button>
                <el-button type="warning" link @click="openStockDialog('out', row)">出库</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="stockPagination.page"
              v-model:page-size="stockPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="stockPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleStockSizeChange"
              @current-change="loadStockList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="出入库记录" name="records">
        <div class="card-shadow" style="padding: 20px">
          <el-form :inline="true" :model="recordSearch" class="mb-16">
            <el-form-item label="备件ID">
              <el-input v-model="recordSearch.part_id" placeholder="请输入备件ID" clearable />
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="recordSearch.low_stock">仅显示库存预警</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRecordSearch">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetRecordSearch">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <el-table :data="recordList" v-loading="recordLoading" style="width: 100%">
            <el-table-column prop="id" label="库存ID" width="80" />
            <el-table-column label="备件名称" width="150">
              <template #default="{ row }">{{ row.part?.name || '-' }}</template>
            </el-table-column>
            <el-table-column label="规格型号" width="140">
              <template #default="{ row }">{{ row.part?.spec || '-' }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="当前数量" width="100" />
            <el-table-column label="单位" width="80">
              <template #default="{ row }">{{ row.part?.unit || '-' }}</template>
            </el-table-column>
            <el-table-column label="单价(元)" width="100">
              <template #default="{ row }">{{ row.part?.unit_price ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="总价值(元)" width="120">
              <template #default="{ row }">¥{{ ((row.quantity || 0) * (row.part?.unit_price || 0)).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="warehouse" label="仓库" width="100" />
            <el-table-column prop="min_stock" label="最低库存" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.quantity <= row.min_stock ? 'danger' : 'success'" size="small">
                  {{ row.quantity <= row.min_stock ? '库存不足' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最后更新" width="170">
              <template #default="{ row }">{{ formatTime(row.last_update) }}</template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="recordPagination.page"
              v-model:page-size="recordPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="recordPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handleRecordSizeChange"
              @current-change="loadRecordList"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="partDialogVisible" :title="partDialogTitle" width="600px" destroy-on-close>
      <el-form :model="partForm" :rules="partRules" ref="partFormRef" label-width="100px">
        <el-form-item label="备件名称" prop="name">
          <el-input v-model="partForm.name" placeholder="请输入备件名称" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="partForm.spec" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="partForm.unit" placeholder="请输入单位（如：个、套、L）" />
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number v-model="partForm.unit_price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="partForm.description" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="partDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPart">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockDialogVisible" :title="stockDialogTitle" width="500px" destroy-on-close>
      <el-form :model="stockForm" :rules="stockRules" ref="stockFormRef" label-width="100px">
        <el-form-item label="备件ID" prop="part_id">
          <el-input-number v-model="stockForm.part_id" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-input v-model="stockForm.warehouse" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最低库存">
          <el-input-number v-model="stockForm.min_stock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最高库存">
          <el-input-number v-model="stockForm.max_stock" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStock">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import StatCard from '@/components/StatCard/index.vue'
import { getSparePartList, getStockRecords, createSparePart, updateSparePart, stockIn, stockOut } from '@/api/sparepart'

const activeTab = ref('stock')
const stockLoading = ref(false)
const recordLoading = ref(false)
const partDialogVisible = ref(false)
const stockDialogVisible = ref(false)
const partDialogTitle = ref('新增备件')
const stockDialogTitle = ref('入库')
const isPartEdit = ref(false)
const partFormRef = ref(null)
const stockFormRef = ref(null)

const stockStats = reactive({
  totalTypes: 0,
  totalQuantity: 0,
  warningCount: 0,
  totalValue: '¥0'
})

const stockSearch = reactive({ name: '' })
const recordSearch = reactive({ part_id: '', low_stock: false })

const stockPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const recordPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const stockList = ref([])
const recordList = ref([])

const partForm = reactive({
  id: null,
  name: '',
  spec: '',
  unit: '个',
  unit_price: 0,
  description: ''
})

const stockForm = reactive({
  type: 'in',
  part_id: null,
  warehouse: '主仓库',
  quantity: 1,
  min_stock: 10,
  max_stock: 100
})

const partRules = {
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }]
}

const stockRules = {
  part_id: [{ required: true, message: '请输入备件ID', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

onMounted(() => {
  loadStockList()
  loadRecordList()
})

function handleStockSizeChange() {
  stockPagination.page = 1
  loadStockList()
}

function handleRecordSizeChange() {
  recordPagination.page = 1
  loadRecordList()
}

function handleStockSearch() {
  stockPagination.page = 1
  loadStockList()
}

function handleRecordSearch() {
  recordPagination.page = 1
  loadRecordList()
}

async function loadStockList() {
  stockLoading.value = true
  try {
    const params = { page: stockPagination.page, pageSize: stockPagination.pageSize }
    if (stockSearch.name) params.name = stockSearch.name

    const res = await getSparePartList(params)
    if (res?.data) {
      stockList.value = res.data.list || []
      stockPagination.total = res.data.total || 0
      computeStockStats(res.data.list || [])
    }
  } catch (e) {
    ElMessage.error('加载库存列表失败')
  } finally {
    stockLoading.value = false
  }
}

function computeStockStats(list) {
  stockStats.totalTypes = stockPagination.total
  stockStats.totalQuantity = list.reduce((sum, item) => sum + (item.quantity || 0), 0)
  stockStats.warningCount = list.filter(item => item.quantity <= item.min_stock).length
  const totalVal = list.reduce((sum, item) => sum + (item.quantity || 0) * (item.part?.unit_price || 0), 0)
  stockStats.totalValue = '¥' + totalVal.toFixed(2)
}

async function loadRecordList() {
  recordLoading.value = true
  try {
    const params = { page: recordPagination.page, pageSize: recordPagination.pageSize }
    if (recordSearch.part_id) params.part_id = recordSearch.part_id
    if (recordSearch.low_stock) params.low_stock = true

    const res = await getStockRecords(params)
    if (res?.data) {
      recordList.value = res.data.list || []
      recordPagination.total = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('加载库存记录失败')
  } finally {
    recordLoading.value = false
  }
}

function resetStockSearch() {
  stockSearch.name = ''
  stockPagination.page = 1
  loadStockList()
}

function resetRecordSearch() {
  recordSearch.part_id = ''
  recordSearch.low_stock = false
  recordPagination.page = 1
  loadRecordList()
}

function openPartDialog() {
  isPartEdit.value = false
  partDialogTitle.value = '新增备件'
  Object.assign(partForm, {
    id: null, name: '', spec: '', unit: '个', unit_price: 0, description: ''
  })
  partDialogVisible.value = true
}

function editPart(row) {
  isPartEdit.value = true
  partDialogTitle.value = '编辑备件'
  const part = row.part || row
  Object.assign(partForm, {
    id: part.id || row.part_id,
    name: part.name || '',
    spec: part.spec || '',
    unit: part.unit || '个',
    unit_price: part.unit_price || 0,
    description: part.description || ''
  })
  partDialogVisible.value = true
}

async function submitPart() {
  if (!partFormRef.value) return
  await partFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isPartEdit.value) {
          await updateSparePart(partForm.id, partForm)
        } else {
          await createSparePart(partForm)
        }
        ElMessage.success(isPartEdit.value ? '更新成功' : '新增成功')
      } catch (e) {
        ElMessage.error(isPartEdit.value ? '更新失败' : '新增失败')
        return
      }
      partDialogVisible.value = false
      loadStockList()
    }
  })
}

function openStockDialog(type, stock = null) {
  stockForm.type = type
  stockDialogTitle.value = type === 'in' ? '备件入库' : '备件出库'
  Object.assign(stockForm, {
    part_id: stock ? (stock.part_id || stock.id) : null,
    warehouse: stock?.warehouse || '主仓库',
    quantity: 1,
    min_stock: stock?.min_stock || 10,
    max_stock: stock?.max_stock || 100
  })
  stockDialogVisible.value = true
}

async function submitStock() {
  if (!stockFormRef.value) return
  await stockFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (stockForm.type === 'in') {
          await stockIn(stockForm)
        } else {
          await stockOut(stockForm)
        }
        ElMessage.success(stockForm.type === 'in' ? '入库成功' : '出库成功')
      } catch (e) {
        ElMessage.error(stockForm.type === 'in' ? '入库失败' : '出库失败')
        return
      }
      stockDialogVisible.value = false
      loadStockList()
      if (activeTab.value === 'records') loadRecordList()
    }
  })
}

function formatTime(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
</script>

<style scoped>
.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
}

.low-stock {
  color: #F56C6C;
  font-weight: 600;
}
</style>
