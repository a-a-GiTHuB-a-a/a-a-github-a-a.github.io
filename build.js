const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");

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
	let new_content;

	switch (path.extname(source_path)) {
		case ".ejs": {
			new_content = ejs.render(template, {
				...JSON.parse(fs.readFileSync(source_path.replace(".ejs", ".json"), {encoding: "utf8"})),
				"body": file
			}, {
				filename: file_path,
				rmWhitespace: true,
			});
			build_path = build_path.replace(".ejs", ".html");
			break;
		}
		case ".json": {
			break;
		}
		default: {
			new_content = file;
			break;
		}
	}

	fs.writeFileSync(build_path, new_content);
}

const template = fs.readFileSync("./template.ejs", {encoding: "utf8"});
fs.rmSync(build_dir, {
	recursive: true,
	force: true,
});
process_dir(".");