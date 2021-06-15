import { createMessageProducer, MessageProducer } from "@javelin/net"
import { InputSample } from "javelin-fps-shared"
import WebSocket from "ws"

export type Client = {
  id: string
  peer: RTCPeerConnection
  socket: WebSocket
  channel: RTCDataChannel | null
  inputs: InputSample[]
  latestInput: InputSample | null
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
    inputs: [],
    latestInput: null,
    producer: createMessageProducer({ maxByteLength: 12_000 }),
    modelSent: false,
  }
}
