const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const swc = require("@swc/core");

if (process.argv.length != 4) {
	console.error("Fatal Error: must have 4 args");
	process.exit(1);
}

const source_dir = process.argv[2];
const build_dir = process.argv[3];

if (path.relative(__dirname, build_dir).includes("..")) {
	console.error("Fatal error: Attempted to modify files outside of this program's scope.");
	process.exit(1);
}

function process_dir(dir_path) {
	console.log(`Checking directory ${dir_path}`);
	const source_path = path.join(source_dir, dir_path);
	const build_path = path.join(build_dir, dir_path);

	const to_read = fs.opendirSync(source_path);
	fs.mkdirSync(build_path);

	while (true) {
		const item = to_read.readSync();

		if (item == null) {
			break;
		} else if (item.isDirectory()) {
			process_dir(path.join(dir_path, item.name));
		} else {
			process_file(path.join(dir_path, item.name));
		}
	}
	
	to_read.closeSync();
}

function process_file(file_path) {
	console.log(`Building file ${file_path}`);
	const source_path = path.join(source_dir, file_path);
	let build_path = path.join(build_dir, file_path);

	const file = fs.readFileSync(source_path, {encoding: "utf8"});

	switch (path.extname(source_path)) {
		case ".ejs": {
			const metadata = JSON.parse(fs.readFileSync(source_path.replace(".ejs", ".json"), {encoding: "utf8"}));
			const new_content = ejs.render(template, {
				...metadata,
				"body": file
			}, {
				filename: file_path,
				rmWhitespace: true,
			});
			build_path = build_path.replace(".ejs", ".html");
			fs.writeFileSync(build_path, new_content);
			break;
		}
		case ".json": {
			break;
		}
		case ".ts": {
			const value = swc.transformFileSync(source_path, {
				jsc: {
					parser: {
						syntax: "typescript",
					},
				},
			});
			fs.writeFileSync(build_path.replace(/\.ts/, ".js"), value.code);
		}
		default: {
			fs.writeFileSync(build_path, file);
			break;
		}
	}
}

const template = fs.readFileSync("./template.ejs", {encoding: "utf8"});
fs.rmSync(build_dir, {
	recursive: true,
	force: true,
});
process_dir(".");