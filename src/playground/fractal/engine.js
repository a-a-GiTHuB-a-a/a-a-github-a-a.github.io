import {Compile} from "./compiler.js";

paper.setup($("#content")[0]);

let current_fractal = Compile("Line 1");

let current_path = Draw(current_fractal, {strokeColor: "#000000"});
paper.view.translate(current_path.firstSegment.point.subtract(current_path.lastSegment.point).divide(2));

function Draw(fractal, config) {
	let p;
	console.groupCollapsed(fractal);
	if (fractal.depth <= 0) {
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
		let context = {};
		depth--;
		p = new paper.Path({
			segments: [position],
			...config
		});
		for (let command of fractal.commands) {
			let value = command.value.evaluate({
				...context,
				position,
				scale,
				depth,
				rotation,
			});
			switch (command.name) {
				case "assign": {
					console.log("Evaluating live assignment");
					context[command.varname] = value;
					break;
				}
				case "rotate": {
					console.log("Rotating by angle", value);
					rotation += value;
					break;
				}
				case "line": {
					const partial_path = Draw({
						...context,
						position,
						rotation,
						depth,
						scale: scale * value,
						commands: fractal.commands,
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
		paper.project.activeLayer.removeChildren();
		paper.view.translate(current_path.lastSegment.point.subtract(current_path.firstSegment.point).divide(2));
		current_path = Draw(current_fractal, {strokeColor: "#000000", strokeWidth: .1});
		paper.view.translate(current_path.firstSegment.point.subtract(current_path.lastSegment.point).divide(2));
		paper.view.update();
	});
});