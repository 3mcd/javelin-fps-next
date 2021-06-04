import {} from "javelin-fps-shared"

const SERVER_HOSTNAME = `${window.location.hostname}:8000`

export async function connect() {
  const iceServers = await (await fetch(`http://${SERVER_HOSTNAME}/ice`)).json()
  const remote = new RTCPeerConnection({ iceServers })
  const channel = remote.createDataChannel("unreliable", {
    ordered: true,
    maxRetransmits: 0,
  })
  const socket = new WebSocket(`ws://${SERVER_HOSTNAME}/connect`)
  socket.binaryType = "arraybuffer"

  function handleSocketMessage({ data }: MessageEvent<string | ArrayBuffer>) {
    if (typeof data !== "string") return
    const message = JSON.parse(data)
    switch (message.type) {
      case "sdp":
        remote.setRemoteDescription(message.sdp)
        break
      case "ice":
        remote.addIceCandidate(message.candidate)
        break
    }
  }

  function handleIceCandidate(event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      socket.send(JSON.stringify({ type: "ice", candidate: event.candidate }))
    }
  }

  socket.addEventListener("message", handleSocketMessage)
  remote.addEventListener("icecandidate", handleIceCandidate)

  async function connectSocket() {
    return new Promise<WebSocket>(resolve => {
      socket.addEventListener("open", () => resolve(socket))
    })
  }

  async function connectChannel() {
    const offer = await remote.createOffer()
    remote.setLocalDescription(offer)
    return new Promise(resolve => {
      socket.send(JSON.stringify({ type: "sdp", sdp: offer }))
      remote.addEventListener("connectionstatechange", () => {
        if (remote.connectionState === "connected") {
          resolve(remote)
        }
      })
    })
  }

  await connectSocket()
  await connectChannel()

  return { socket, channel }
}
