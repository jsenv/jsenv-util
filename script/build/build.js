import { buildProject, getBabelPluginMapForNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

buildProject({
  ...jsenvConfig,
  buildDirectoryRelativeUrl: "./dist/commonjs/",
  entryPointMap: {
    "./index.js": "./jsenv_util.cjs",
  },
  format: "commonjs",
  babelPluginMap: getBabelPluginMapForNode(),
  buildDirectoryClean: true,
})
