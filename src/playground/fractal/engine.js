paper.setup($("#content")[0]);

function template(strings, ...values) {
	s = strings[0];
	let i = 0;
	while (i < values.length) {
		let val = values[i];
		if (val.constructor.name === "RegExp") {
			val = val.toString();
			val = val.substring(1, val.length - 1);
		}
		s += val;
		s += strings[++i];
	}
	return s;
}

function re(flags) {
	return (...args) => new RegExp(template(...args), flags);
}

let current_fractal = {
	position: paper.view.center,
	scale: 100,
	depth: 0,
	rotation: 0,
	commands: [
		{
			name: "line",
			value: 1
		}
	]
};
let current_path = Draw(current_fractal, {strokeColor: "#000000"});

const ident_re = /[A-Za-z_-]+/;
const num_re = /(?:-?\d+(?:\.\d*)?)|(?:-?\.\d*)/;
const line_sep_re = /\s*;\s*/m;
const var_re = re("m")`(?<varname>${ident_re})\s*=\s*(?<value>${num_re})`;
const cmd_re = re("m")`(?<cmdname>${ident_re})\\s+(?<value>${num_re})`;

function Compile(contents) {
	console.group("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = {
		position: paper.view.center,
		initial_scale: 100,
		depth: 5,
		rotation: 0,
		commands: [],
	};
	for (let lineIndex in lines) {
		console.groupCollapsed(`Line ${lineIndex}`);
		const line = lines[lineIndex];
		let assign = var_re.exec(line);
		if (assign !== null) {
			console.log("Declaration detected!");
			switch (assign.groups.varname) {
				case "initialscale":
				case "initial_scale":
				case "initial-scale": {
					frac.initial_scale = +assign.groups.value;
					break;
				}
				case "depth": {
					frac.depth = +assign.groups.value;
					break;
				}
				case "rotation": {
					frac.rotation = +assign.groups.value;
					break;
				}
			}
		} else {
			let cmd = cmd_re.exec(line);
			if (cmd !== null) {
				console.log("Command detected!");
				console.log(`Name: ${cmd.groups.cmdname.toLowerCase()}`);
				frac.commands.push({
					name: cmd.groups.cmdname.toLowerCase(),
					value: parseFloat(cmd.groups.value)
				});
			}
		}
		console.log(`Line was ${line}`);
		console.groupEnd();
	}
	console.log("Fractal compiling finished!");
	console.groupEnd();
	return frac;
}

function Draw(fractal, config) {
	if (fractal.depth === 0) {
		return paper.Path.Line({
			from: fractal.position,
			to: [
				fractal.position.x + fractal.scale * Math.cos(fractal.rotation),
				fractal.position.y + fractal.scale * Math.sin(fractal.rotation)
			],
			...config
		});
	} else {
		fractal.depth--;
		let p = new paper.Path({
			segments: [fractal.position],
			...config
		});
		for (let command of fractal.commands) {
			switch (command.name) {
				case "rotate": {
					fractal.rotation += command.value;
					break;
				}
				case "line": {
					fractal.scale *= command.value;
					const subsegs = Draw(fractal, config).segments;
					p.addSegments(subsegs.slice(1));
					fractal.position = subsegs[subsegs.length-1].point;
					break;
				}
			}
		}
		return p;
	}
}

$("#newfrac").on("submit", function(e) {
	e.preventDefault();
	e.stopPropagation();
	const file = $("#fracfile")[0].files[0];
	file.text().then((data) => {
		current_fractal = Compile(data);
		current_path = Draw(current_fractal, {strokeColor: "#000000"});
		current_path.visible = false;
		paper.view.update();
		current_path.visible = true;
		paper.view.update();
	});
});