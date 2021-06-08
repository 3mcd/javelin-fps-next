import { createMessageProducer, MessageProducer } from "@javelin/net"
import WebSocket from "ws"

export type Client = {
  id: string
  peer: RTCPeerConnection
  socket: WebSocket
  channel: RTCDataChannel | null
  producer: MessageProducer
  modelSent: boolean
}

export function createClient(
  id: string,
  peer: RTCPeerConnection,
  socket: WebSocket,
  channel: RTCDataChannel | null = null,
): Client {
  return {
    id,
    peer,
    socket,
    channel,
    producer: createMessageProducer({ maxByteLength: 10_000 }),
    modelSent: false,
  }
}
