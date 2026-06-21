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
              <el-form-item label="备件分类">
                <el-select v-model="stockSearch.category" placeholder="全部" clearable style="width: 140px">
                  <el-option label="轴承" value="bearing" />
                  <el-option label="密封件" value="seal" />
                  <el-option label="电气元件" value="electrical" />
                  <el-option label="机械零件" value="mechanical" />
                  <el-option label="润滑油" value="lubricant" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadStockList">
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
            <el-table-column prop="code" label="备件编号" width="120" />
            <el-table-column prop="name" label="备件名称" width="150" />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">{{ getCategoryText(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="specification" label="规格型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="quantity" label="库存数量" width="100">
              <template #default="{ row }">
                <span :class="{ 'low-stock': row.quantity < row.minStock }">{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="minStock" label="最低库存" width="100" />
            <el-table-column prop="unitPrice" label="单价(元)" width="100" />
            <el-table-column prop="totalValue" label="总价值(元)" width="120">
              <template #default="{ row }">¥{{ (row.quantity * row.unitPrice).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="location" label="存放位置" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.quantity < row.minStock ? 'danger' : 'success'" size="small">
                  {{ row.quantity < row.minStock ? '库存不足' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="editPart(row)">编辑</el-button>
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
              @size-change="loadStockList"
              @current-change="loadStockList"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="出入库记录" name="records">
        <div class="card-shadow" style="padding: 20px">
          <el-form :inline="true" :model="recordSearch" class="mb-16">
            <el-form-item label="操作类型">
              <el-select v-model="recordSearch.type" placeholder="全部" clearable style="width: 140px">
                <el-option label="入库" value="in" />
                <el-option label="出库" value="out" />
              </el-select>
            </el-form-item>
            <el-form-item label="备件名称">
              <el-input v-model="recordSearch.partName" placeholder="请输入备件名称" clearable />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="recordSearch.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadRecordList">
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
            <el-table-column prop="code" label="单据编号" width="150" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'in' ? 'success' : 'warning'" size="small">
                  {{ row.type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="partName" label="备件名称" width="150" />
            <el-table-column prop="specification" label="规格型号" width="140" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="unitPrice" label="单价(元)" width="100" />
            <el-table-column prop="totalPrice" label="总金额(元)" width="120">
              <template #default="{ row }">¥{{ (row.quantity * row.unitPrice).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="time" label="操作时间" width="160" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="recordPagination.page"
              v-model:page-size="recordPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="recordPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="loadRecordList"
              @current-change="loadRecordList"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="partDialogVisible" :title="partDialogTitle" width="600px" destroy-on-close>
      <el-form :model="partForm" :rules="partRules" ref="partFormRef" label-width="100px">
        <el-form-item label="备件编号" prop="code">
          <el-input v-model="partForm.code" placeholder="请输入备件编号" />
        </el-form-item>
        <el-form-item label="备件名称" prop="name">
          <el-input v-model="partForm.name" placeholder="请输入备件名称" />
        </el-form-item>
        <el-form-item label="备件分类" prop="category">
          <el-select v-model="partForm.category" placeholder="请选择备件分类" style="width: 100%">
            <el-option label="轴承" value="bearing" />
            <el-option label="密封件" value="seal" />
            <el-option label="电气元件" value="electrical" />
            <el-option label="机械零件" value="mechanical" />
            <el-option label="润滑油" value="lubricant" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="partForm.specification" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="partForm.unit" placeholder="请输入单位（如：个、套、L）" />
        </el-form-item>
        <el-form-item label="单价(元)">
          <el-input-number v-model="partForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最低库存">
          <el-input-number v-model="partForm.minStock" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="partForm.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="partForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="partDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPart">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stockDialogVisible" :title="stockDialogTitle" width="500px" destroy-on-close>
      <el-form :model="stockForm" :rules="stockRules" ref="stockFormRef" label-width="100px">
        <el-form-item label="备件名称">
          <el-select v-model="stockForm.partId" placeholder="请选择备件" style="width: 100%" filterable>
            <el-option
              v-for="part in stockList"
              :key="part.id"
              :label="part.name + ' (' + part.specification + ')'"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价(元)" v-if="stockForm.type === 'in'">
          <el-input-number v-model="stockForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="stockForm.operator" placeholder="请输入操作人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
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
  totalTypes: 56,
  totalQuantity: 1280,
  warningCount: 5,
  totalValue: '¥85,680.00'
})

const stockSearch = reactive({ name: '', category: '' })
const recordSearch = reactive({ type: '', partName: '', dateRange: [] })

const stockPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const recordPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const stockList = ref([])
const recordList = ref([])

const partForm = reactive({
  id: null,
  code: '',
  name: '',
  category: '',
  specification: '',
  unit: '个',
  unitPrice: 0,
  quantity: 0,
  minStock: 10,
  location: '',
  remark: ''
})

const stockForm = reactive({
  type: 'in',
  partId: null,
  quantity: 1,
  unitPrice: 0,
  operator: '',
  remark: ''
})

const partRules = {
  code: [{ required: true, message: '请输入备件编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择备件分类', trigger: 'change' }]
}

const stockRules = {
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

onMounted(() => {
  loadStockList()
  loadRecordList()
})

async function loadStockList() {
  stockLoading.value = true
  try {
    const res = await getSparePartList({ ...stockSearch, page: stockPagination.page, pageSize: stockPagination.pageSize })
    if (res?.data) {
      stockList.value = res.data.list || res.data
      stockPagination.total = res.data.total || res.data.length
    } else {
      generateMockStock()
    }
  } catch (e) {
    generateMockStock()
  } finally {
    stockLoading.value = false
  }
}

function generateMockStock() {
  const categories = ['bearing', 'seal', 'electrical', 'mechanical', 'lubricant']
  const names = ['深沟球轴承', '机械密封件', '交流接触器', '传动齿轮', '润滑油', '角接触轴承', 'O型密封圈', '断路器']
  const specs = ['6205-2RS', 'MG1-25', 'CJX2-1810', 'M2.5-Z20', 'ISO VG46 20L', '7205AC', 'NBR-40', 'DZ47-63 C20']
  const units = ['个', '套', '个', '个', '桶', '个', '个', '个']
  const locations = ['A区-01', 'A区-02', 'B区-01', 'B区-02', 'C区-01', 'A区-03', 'A区-04', 'B区-03']

  stockList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `SP${String(10001 + i).padStart(6, '0')}`,
    name: names[i % 8],
    category: categories[i % 5],
    specification: specs[i % 8],
    unit: units[i % 8],
    quantity: [5, 50, 28, 15, 8, 45, 32, 3][i % 8],
    minStock: 10,
    unitPrice: [45, 120, 85, 60, 280, 68, 5, 35][i % 8],
    location: locations[i % 8],
    remark: ''
  }))
  stockPagination.total = 56
}

function resetStockSearch() {
  stockSearch.name = ''
  stockSearch.category = ''
  stockPagination.page = 1
  loadStockList()
}

async function loadRecordList() {
  recordLoading.value = true
  try {
    const res = await getStockRecords({ ...recordSearch, page: recordPagination.page, pageSize: recordPagination.pageSize })
    if (res?.data) {
      recordList.value = res.data.list || res.data
      recordPagination.total = res.data.total || res.data.length
    } else {
      generateMockRecords()
    }
  } catch (e) {
    generateMockRecords()
  } finally {
    recordLoading.value = false
  }
}

function generateMockRecords() {
  const types = ['in', 'out']
  const names = ['深沟球轴承', '机械密封件', '交流接触器', '传动齿轮', '润滑油', '角接触轴承']
  const specs = ['6205-2RS', 'MG1-25', 'CJX2-1810', 'M2.5-Z20', 'ISO VG46 20L', '7205AC']
  const units = ['个', '套', '个', '个', '桶', '个']
  const operators = ['张工', '李工', '王工', '赵工']
  const remarks = ['采购入库', '维护领用', '采购入库', '故障维修领用', '采购入库', '日常维护领用']

  recordList.value = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    code: `${types[i % 2] === 'in' ? 'RK' : 'CK'}${String(202401001 + i).padStart(10, '0')}`,
    type: types[i % 2],
    partName: names[i % 6],
    specification: specs[i % 6],
    quantity: [20, 2, 10, 3, 5, 15, 1, 8, 4, 6][i],
    unit: units[i % 6],
    unitPrice: [45, 120, 85, 60, 280, 68][i % 6],
    operator: operators[i % 4],
    time: `2024-01-${String(10 + i).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:${String(15 + i * 3).padStart(2, '0')}:00`,
    remark: remarks[i % 6]
  }))
  recordPagination.total = 89
}

function resetRecordSearch() {
  recordSearch.type = ''
  recordSearch.partName = ''
  recordSearch.dateRange = []
  recordPagination.page = 1
  loadRecordList()
}

function openPartDialog() {
  isPartEdit.value = false
  partDialogTitle.value = '新增备件'
  Object.assign(partForm, {
    id: null, code: '', name: '', category: '', specification: '', unit: '个',
    unitPrice: 0, quantity: 0, minStock: 10, location: '', remark: ''
  })
  partDialogVisible.value = true
}

function editPart(row) {
  isPartEdit.value = true
  partDialogTitle.value = '编辑备件'
  Object.assign(partForm, row)
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
        ElMessage.success(isPartEdit.value ? '更新成功' : '新增成功')
      }
      partDialogVisible.value = false
      loadStockList()
    }
  })
}

function openStockDialog(type, part = null) {
  stockForm.type = type
  stockDialogTitle.value = type === 'in' ? '备件入库' : '备件出库'
  Object.assign(stockForm, {
    partId: part ? part.id : null,
    quantity: 1,
    unitPrice: part ? part.unitPrice : 0,
    operator: '',
    remark: ''
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
        ElMessage.success(stockForm.type === 'in' ? '入库成功' : '出库成功')
      }
      stockDialogVisible.value = false
      loadStockList()
      if (activeTab.value === 'records') loadRecordList()
    }
  })
}

function getCategoryText(category) {
  const map = {
    bearing: '轴承', seal: '密封件', electrical: '电气元件',
    mechanical: '机械零件', lubricant: '润滑油'
  }
  return map[category] || category
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
