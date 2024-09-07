class Fractal {
	scale;
	depth;
	rotation;
	commands;

	Fractal(scale, depth, rotation, commands) {
		this.scale = scale;
		this.depth = depth;
		this.rotation = rotation;
		this.commands = commands;
	}
}

function t(strings, ...values) {
	s = strings[0];
	let i = 0;
	while (true) {
		try {
			s += values[i];
			s += strings[i+1];
			i++;
		} catch {
			break;
		}
	}
}

function re(flags) {
	return (...args) => new RegExp(t(...args), flags);
}

let current_fractal = new Fractal(100, 5, 0, [{
	name: "line",
	value: 1
}]);
let current_path = Draw(paper.view.center, current_fractal);

const num_re = /\d+(\.\d+)?/;
const line_sep_re = /\s+;\s+/m;
const var_re = /(?<varname>[a-z]+)\s+=\s+(?<value>[a-z]+)/m;
const cmd_re = re("m")`(?<cmdname>[a-z]+)\s+(?<value>${num_re})`;

$("#newfrac").on("submit", async function(e) {
	e.preventDefault();
	current_fractal = Compile(await $("#fracfile")[0].files[0].text());
});

async function Compile(contents) {
	console.log("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = new Fractal();
	let initial_scale = 100;
	let depth = 5;
	let cmds = [];
	for (let line in lines) {
		let assign = var_re.exec(line);
		if (assign !== null) {
			switch (assign.groups.varname) {
				case "initialscale":
				case "initial_scale":
				case "initial-scale": {
					initial_scale = +assign.groups.value;
					break;
				}
				case "depth": {
					depth = +assign.groups.value;
					break;
				}
				case "rotation": {
					rotation = +assign.groups.value;
					break;
				}
			}
			continue;
		}
		let cmd = cmd_re.exec(line);
		if (cmd !== null) {
			cmds.push({
				name: cmd.groups.cmdname.toLowerCase(),
				value: cmd.groups.value
			});
		}
	}
	frac.scale = initial_scale;
	frac.depth = depth;
	frac.rotation = rotation;
	frac.commands = cmds;
	console.log("Fractal compiling finished");
	return frac;
}

function Draw(position, fractal) {
	let scale = fractal.scale;
	let rotation = fractal.rotation;
	let depth = fractal.depth;
	if (depth == 0) {
		return Path.Line({
			from: position,
			to: [
				position.x + scale * Math.cos(rotation),
				position.y + scale * Math.sin(rotation)
			]
		});
	} else {
		depth--;
		let p = new Path().add(new Segment(position));
		for (let command of fractal.commands) {
			switch (command.name) {
				case "rotate": {
					rotation += command.value;
					break;
				}
				case "line": {
					scale *= command.value;
					p.addSegments(Draw(p, new Fractal(scale, depth, rotation, commands)).segments);
					break;
				}
			}
		}
	}
}

onFrame = (e) => {
	current_path = Draw(paper.view.center, current_fractal);
	view.translate(
		current_fractal.scale * Math.cos(current_fractal.rotation),
		current_fractal.scale * Math.sin(current_fractal.rotation)
	);
};

paper.setup("content");
paper.activate();