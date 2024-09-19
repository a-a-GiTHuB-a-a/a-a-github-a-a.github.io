import {Compile} from "./compiler.js";

paper.setup($("#content")[0]);

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

function Draw(fractal, config) {
	let p;
	console.groupCollapsed(fractal);
	if (fractal.depth <= 0) {
		console.log(fractal.position);
		p = new paper.Path({
			segments: [
				fractal.position,
				[
					fractal.position.x + fractal.scale * Math.cos(fractal.rotation*Math.PI/180),
					fractal.position.y + fractal.scale * Math.sin(fractal.rotation*Math.PI/180)
				]
			],
			...config,
		});
		console.log("Degenerate case found:", p);
	} else {
		let {position, scale, depth, rotation} = fractal;
		depth--;
		p = new paper.Path({
			segments: [position],
			...config
		});
		for (let command of fractal.commands) {
			switch (command.name) {
				case "rotate": {
					rotation += command.value;
					break;
				}
				case "line": {
					const partial_path = Draw({
						position,
						scale: scale * command.value,
						depth,
						rotation,
						commands:fractal.commands
					}, config);
					p.addSegments(partial_path.segments.slice(1));
					position = partial_path.lastSegment.point;
				}
			}
		}
		console.log("Backtracking now");
	}
	console.groupEnd();
	return p;
}

$("#newfrac").on("submit", function(e) {
	e.preventDefault();
	e.stopPropagation();
	const file = $("#fracfile")[0].files[0];
	file.text().then((data) => {
		current_fractal = Compile(data);
		current_path.replaceWith(current_path = Draw(current_fractal, {strokeColor: "#000000"}));
		paper.view.update();
	});
});