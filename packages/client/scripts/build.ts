import { build } from "esbuild"
import server from "live-server"
import minimist from "minimist"
import path from "path"

const argv = minimist(process.argv.slice(2))

build({
  entryPoints: [path.join(__dirname, "../dist/index.js")],
  outdir: path.join(__dirname, "../public"),
  sourcemap: argv.watch ? "inline" : "external",
  watch: argv.watch,
  bundle: true,
  minify: false,
  format: "esm",
  external: ["perf_hooks"],
  plugins: [],
})

if (argv.watch) {
  server.start({
    open: true,
    port: Number(process.env.PORT) || 3000,
    root: "public",
  })
}

process.stdin.resume()
function onExit(options: { cleanup?: boolean; exit?: boolean }) {
  if (options.cleanup) server.shutdown()
  if (options.exit) process.exit()
}
process.on("exit", onExit.bind(null, { cleanup: true }))
process.on("SIGINT", onExit.bind(null, { exit: true }))
process.on("SIGUSR1", onExit.bind(null, { exit: true }))
process.on("SIGUSR2", onExit.bind(null, { exit: true }))
process.on("uncaughtException", onExit.bind(null, { exit: true }))
