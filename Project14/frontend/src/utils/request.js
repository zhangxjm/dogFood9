import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 0) {
      return res.data
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    return Promise.reject(error)
  }
)

export default request
