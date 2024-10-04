const fs = require("node:fs/promises");
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

async function process_dir(dir_path) {
	console.log(`Checking directory ${dir_path}`);
	const source_path = path.join(source_dir, dir_path);
	const build_path = path.join(build_dir, dir_path);

	const to_read = await fs.opendir(source_path);
	if (!(await fs.exists(build_path))) await fs.mkdir(build_path);

	await Promise.all(to_read.map(item => {
		if (item.isDirectory()) {
			return process_dir(path.join(dir_path, item.name));
		} else {
			return process_file(path.join(dir_path, item.name));
		}
	}));
	
	await to_read.close();
}

async function process_file(file_path) {
	console.log(`Building file ${file_path}`);
	const source_path = path.join(source_dir, file_path);
	let build_path = path.join(build_dir, file_path);

	const file = await fs.readFile(source_path, {encoding: "utf8"});

	switch (path.extname(source_path)) {
		case ".ejs": {
			const metadata = JSON.parse(await fs.readFile(source_path.replace(".ejs", ".json"), {encoding: "utf8"}));
			const new_content = ejs.render(template, {
				...metadata,
				"body": file
			}, {
				filename: file_path,
				rmWhitespace: true,
			});
			build_path = build_path.replace(".ejs", ".html");
			await fs.writeFile(build_path, new_content);
			break;
		}
		case ".ts":
		case ".tsx":
		case ".jsx":
		case ".json":
			break;
		default: {
			await fs.writeFile(build_path, file);
			break;
		}
	}
}

fs.readFile("./template.ejs", {encoding: "utf8"}).then(template => process_dir("."));