paper.setup($("#content")[0]);

function template(strings, ...values) {
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
	return (...args) => new RegExp(template(...args), flags);
}

let current_fractal = {
	scale: 100,
	depth: 5,
	rotation: 0,
	commands: [
		{
			name: "line",
			value: 1
		}
	]
};
let current_path = Draw(paper.view.center, current_fractal);

const num_re = /\d+(\.\d+)?/;
const line_sep_re = /\s+;\s+/m;
const var_re = /(?<varname>[a-z]+)\s+=\s+(?<value>[a-z]+)/m;
const cmd_re = re("m")`(?<cmdname>[a-z]+)\s+(?<value>${num_re})`;

function Compile(contents) {
	console.log("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = {
		initial_scale: 100,
		depth: 5,
		rotation: 0,
		commands: [],
	};
	for (let line in lines) {
		let assign = var_re.exec(line);
		if (assign !== null) {
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
			continue;
		}
		let cmd = cmd_re.exec(line);
		if (cmd !== null) {
			frac.commands.push({
				name: cmd.groups.cmdname.toLowerCase(),
				value: cmd.groups.value
			});
		}
	}
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
		let p = new paper.Path();
		p.add(new paper.Segment(position));
		for (let command of fractal.commands) {
			switch (command.name) {
				case "rotate": {
					rotation += command.value;
					break;
				}
				case "line": {
					scale *= command.value;
					p.addSegments(Draw(p, {scale, depth, rotation, commands}).segments);
					break;
				}
			}
		}
		return p;
	}
}

paper.onFrame = (e) => {
	current_path = Draw(paper.view.center, current_fractal);
	paper.view.translate(
		current_fractal.scale * Math.cos(current_fractal.rotation),
		current_fractal.scale * Math.sin(current_fractal.rotation)
	);
};

$("#newfrac").on("submit", function(e) {
	e.preventDefault();
	e.stopPropagation();
	const file = $("#fracfile")[0].files[0];
	file.text().then((data) => {
		current_fractal = Compile(data);
	});
});