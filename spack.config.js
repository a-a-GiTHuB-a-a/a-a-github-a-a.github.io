const {config} = require("@swc/core/spack");
const path = require("node:path");

const source_path = path.join(__dirname, "src/");
const build_path = path.join(__dirname, "site/");

module.exports = config({
	workingDir: __dirname,
	entry: {
		fractal: {
			import: path.join(source_path, "playground/fractal/engine.ts"),
			filename: path.join(build_path, "playground/fractal/engine.js"),
		},
	},
});