import { WorldTickData as WorldTickDataShared } from "javelin-fps-shared"
import { Client } from "../net"

export type WorldTickData = WorldTickDataShared & { client: Client }
