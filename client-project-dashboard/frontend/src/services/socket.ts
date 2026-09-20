const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000/ws";

let socket: WebSocket | null = null;
const listeners: Array<(message: any) => void> = [];

export function connectSocket(accessToken: string) {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  socket = new WebSocket(`${WS_URL}?token=${accessToken}`);

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      listeners.forEach((listener) => listener(message));
    } catch (error) {
      console.error("Failed to parse WebSocket message", error);
    }
  };

  socket.onclose = () => {
    socket = null;
  };

  return socket;
}

export function disconnectSocket() {
  socket?.close();
  socket = null;
}

export function onSocketMessage(callback: (message: any) => void) {
  listeners.push(callback);
  // returns an unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) listeners.splice(index, 1);
  };
}

export function joinProjectRoom(projectId: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "JOIN_PROJECT", projectId }));
  }
}

export function leaveProjectRoom() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "LEAVE_PROJECT" }));
  }
}
