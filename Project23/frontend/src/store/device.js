import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDeviceStore = defineStore('device', () => {
  const deviceList = ref([])
  const currentDevice = ref(null)
  const loading = ref(false)

  const onlineCount = computed(() => 
    deviceList.value.filter(d => d.status === 'running' || d.status === 'online').length
  )

  const offlineCount = computed(() => 
    deviceList.value.filter(d => d.status === 'stopped' || d.status === 'offline').length
  )

  const faultCount = computed(() => 
    deviceList.value.filter(d => d.status === 'fault').length
  )

  function setDeviceList(list) {
    deviceList.value = list
  }

  function setCurrentDevice(device) {
    currentDevice.value = device
  }

  function setLoading(val) {
    loading.value = val
  }

  return {
    deviceList,
    currentDevice,
    loading,
    onlineCount,
    offlineCount,
    faultCount,
    setDeviceList,
    setCurrentDevice,
    setLoading
  }
})
