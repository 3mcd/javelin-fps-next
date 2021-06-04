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
  minify: argv.build,
  format: "esm",
})
if (argv.watch) {
  server.start({
    open: true,
    port: Number(process.env.PORT) || 3000,
    root: "public",
  })
}
