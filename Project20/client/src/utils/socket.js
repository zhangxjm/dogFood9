import { io } from 'socket.io-client'
import { useUserStore } from '../stores/user'

let socket = null

export function createSocket() {
  const userStore = useUserStore()
  socket = io({
    auth: {
      token: userStore.token
    }
  })
  return socket
}

export function getSocket() {
  if (!socket) {
    return createSocket()
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
