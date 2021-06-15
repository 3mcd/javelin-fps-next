import crypto from "crypto"
import * as http from "http"
import { createSignal } from "javelin-fps-shared"
import twilio from "twilio"
import WebRTC from "wrtc"
import WebSocket from "ws"
import { Client, createClient } from "./client"

const twilioClient = twilio(
  "AC2569374b9d797a2a6c29d1b502600be0",
  "f01e6d493e391b8cb40136b2aa733546",
)
const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Origin, X-Requested-With, Content-Type, Accept",
  "Content-Type": "application/json",
}
const iceServers = twilioClient.tokens
  .create()
  .then(token => token.iceServers)
  .catch(() => [] as string[])
export const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/ice") {
    iceServers.then(result => {
      res.writeHead(200, jsonHeaders)
      res.write(JSON.stringify(result))
      res.end()
    })
  }
})
export const clients = new Map<string, Client>()
export const onClientConnected = createSignal<Client>()
export const onClientDisconnected = createSignal<Client>()
const sockets = new WebSocket.Server({ noServer: true })

onClientConnected(client => clients.set(client.id, client))
onClientDisconnected(client => clients.delete(client.id))

function encodeSignalingMessage(data: unknown) {
  return JSON.stringify(data)
}
function decodeSignalingMessage(data: string) {
  return JSON.parse(data)
}
async function handleSignalingMessage(client: Client, message: any) {
  switch (message.type) {
    case "sdp": {
      client.peer.setRemoteDescription(message.sdp)
      const answer = await client.peer.createAnswer()
      client.peer.setLocalDescription(answer)
      client.socket.send(JSON.stringify({ type: "sdp", sdp: answer }))
      break
    }
    case "ice": {
      client.peer.addIceCandidate(message.candidate)
      break
    }
  }
}

function registerClient(client: Client) {
  client.socket.send(encodeSignalingMessage({ type: "id", id: client.id }))
  client.socket.on("message", async data => {
    if (typeof data === "string") {
      handleSignalingMessage(client, decodeSignalingMessage(data))
    }
  })
  client.socket.on("close", () => {
    client.channel?.close()
    onClientDisconnected.dispatch(client)
  })
  client.peer.addEventListener("icecandidate", event =>
    client.socket.send(
      encodeSignalingMessage({ type: "ice", candidate: event.candidate }),
    ),
  )
  client.peer.addEventListener("datachannel", ({ channel }) => {
    channel.addEventListener("open", () => {
      client.channel?.close()
      client.channel = channel
      onClientConnected.dispatch(client as Client)
    })
  })
}

sockets.on("connection", async socket => {
  try {
    const result = await iceServers
    const id = crypto.randomBytes(16).toString("hex")
    const peer = new WebRTC.RTCPeerConnection({ iceServers: result })
    const client = createClient(id, peer, socket)
    registerClient(client)
  } catch (err) {
    console.error("Failed to register client.")
    console.error(err.message)
    socket.close()
  }
})

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/connect") {
    sockets.handleUpgrade(req, socket, head, ws =>
      sockets.emit("connection", ws, req),
    )
  } else {
    socket.destroy()
  }
})
