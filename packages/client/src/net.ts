import {} from "javelin-fps-shared"

const hostname = window.location.hostname
const SERVER_HOSTNAME = `${
  hostname === "127.0.0.1" ? "localhost" : hostname
}:8000`

export type Client = {
  id: string
  socket: WebSocket
  channel: RTCDataChannel
}

export async function connect(): Promise<Client> {
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
    return new Promise<string>(resolve => {
      socket.addEventListener("message", onceIdentity)
      function onceIdentity({ data }: MessageEvent) {
        if (typeof data === "string") {
          const message = JSON.parse(data)
          if (message.type === "id") {
            resolve(message.id)
            socket.removeEventListener("message", onceIdentity)
          }
        }
      }
    })
  }

  async function connectChannel() {
    const offer = await remote.createOffer()
    remote.setLocalDescription(offer)
    return new Promise(resolve => {
      socket.send(JSON.stringify({ type: "sdp", sdp: offer }))
      channel.addEventListener("open", () => resolve(channel))
    })
  }

  const id = await connectSocket()
  await connectChannel()

  return { id, socket, channel }
}
