paper.setup($("#content")[0]);

function template(strings, ...values) {
	s = strings[0];
	let i = 0;
	while (i < values.length) {
		let val = values[i];
		if (val.constructor.name === "RegExp") {
			val = val.toString().substring(1, -1);
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

const ident_re = /[A-Za-z_-]+/;
const num_re = /\d+(\.\d+)?/;
const line_sep_re = /\s*;\s*/m;
const var_re = re("m")`(?<varname>${ident_re})\s*=\s*(?<value>${num_re})`;
const cmd_re = re("m")`(?<cmdname>${ident_re})\s+(?<value>${num_re})`;

function Compile(contents) {
	console.group("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = {
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
			continue;
		}
		let cmd = cmd_re.exec(line);
		if (cmd !== null) {
			console.log("Command detected!");
			frac.commands.push({
				name: cmd.groups.cmdname.toLowerCase(),
				value: cmd.groups.value
			});
		}
		console.log(`Line was ${line}`);
		console.groupEnd();
	}
	console.log("Fractal compiling finished!");
	console.groupEnd();
	return frac;
}

function Draw(position, fractal) {
	if (fractal.depth === 0) {
		return paper.Path.Line({
			from: position,
			to: [
				position.x + fractal.scale * Math.cos(fractal.rotation),
				position.y + fractal.scale * Math.sin(fractal.rotation)
			]
		});
	} else {
		fractal.depth--;
		let p = new paper.Path();
		p.add(new paper.Segment(position));
		for (let command of fractal.commands) {
			switch (command.name) {
				case "rotate": {
					fractal.rotation += command.value;
					break;
				}
				case "line": {
					fractal.scale *= command.value;
					p.addSegments(Draw(p, fractal).segments);
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