import {Compile, Fractal} from "./compiler";
import {ContextObject} from "./AST";
import paper from "paper";
import $ from "jquery";

paper.setup($("canvas#content")[0] as HTMLCanvasElement);

let current_fractal = Compile("Line 1");

let current_path = Draw(current_fractal, {strokeColor: "#000000", strokeWidth: 1});
center(current_path);

function Draw(fractal:Fractal, config:object):paper.Path {
	let p:paper.Path;
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
		let context:ContextObject = {};
		depth--;
		p = new paper.Path({
			segments: [position],
			...config
		});
		for (let command of fractal.commands) {
			let value = command.value.evaluate({
				...context,
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

function midpoint(path:paper.Path):paper.Point {
	return path.lastSegment.point.add(path.firstSegment.point).divide(2);
}

function center(path:paper.Path):void {
	path.position = path.position.subtract(midpoint(current_path));
}

$("#fracfile").on("change", function(this:HTMLInputElement) {
	const file = this.files[0];
	file.text().then((data:string) => {
		current_fractal = Compile(data);
		paper.project.activeLayer.removeChildren();
		current_path = Draw(current_fractal, {strokeColor: "#000000", strokeWidth: 1});
		center(current_path);
	});
});