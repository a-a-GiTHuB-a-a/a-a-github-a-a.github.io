const fsPromises = require("node:fs/promises");
const path = require("node:path");
const ejs = require("ejs");

if (process.argv.length != 4) {
	console.error("Fatal Error: must have 2 args");
	process.exit(1);
}

const source_dir = process.argv[2];
const build_dir = process.argv[3];

if (path.relative(__dirname, build_dir).includes("..")) {
	console.error("Fatal error: Attempted to modify files outside of this program's scope.");
	process.exit(1);
}

async function process_dir(dir_path, opts) {
	console.log(`Checking directory ${dir_path}`);
	const source_path = path.join(source_dir, dir_path);
	const build_path = path.join(build_dir, dir_path);

	const to_read = await fsPromises.opendir(source_path);
	await fsPromises.stat(build_path).catch(() => fsPromises.mkdir(build_path));

	for await (let item of to_read) {
		if (item.isDirectory()) {
			await process_dir(path.join(dir_path, item.name), opts);
		} else {
			await process_file(path.join(dir_path, item.name), opts);
		}
	}
}

async function process_file(file_path, opts) {
	console.log(`Building file ${file_path}`);
	const source_path = path.join(source_dir, file_path);
	let build_path = path.join(build_dir, file_path);

	const file = await fsPromises.readFile(source_path, {encoding: "utf8"});

	switch (path.extname(source_path)) {
		case ".ejs": {
			const metadata = await fsPromises.readFile(source_path.replace(".ejs", ".json"), {encoding: "utf8"}).then(JSON.parse, () => {});
			const new_content = ejs.render(opts.ejs_template, {
				...metadata,
				"body": file
			}, {
				filename: file_path,
				rmWhitespace: true,
			});
			build_path = build_path.replace(".ejs", ".html");
			await fsPromises.writeFile(build_path, new_content);
			break;
		}
		case ".ts":
		case ".tsx":
		case ".jsx":
		case ".json":
			break;
		default: {
			await fsPromises.copyFile(file_path, build_path);
			break;
		}
	}
}

fsPromises.readFile("./template.ejs", {encoding: "utf8"}).then(template => process_dir(".", {ejs_template: template}));