import { createMessageProducer, MessageProducer } from "@javelin/net"
import { InputSample } from "javelin-fps-shared"
import WebSocket from "ws"

export type Client = {
  id: string
  peer: RTCPeerConnection
  socket: WebSocket
  channel: RTCDataChannel | null
  input: {
    buffer: InputSample[]
    latestSample: InputSample | null
    latestShrink: number
    rate: number
  }
  producer: MessageProducer
  initialized: boolean
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
    input: {
      buffer: [],
      latestSample: null,
      latestShrink: 0,
      rate: 1,
    },
    producer: createMessageProducer({ maxByteLength: Infinity }),
    initialized: false,
  }
}
