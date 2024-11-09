import {Compile, Fractal} from "./compiler";
import {ContextObject} from "./AST";
import paper from "paper";
import $ from "jquery";

paper.setup($("canvas#content")[0] as HTMLCanvasElement);

type StyleConfig = Partial<Omit<paper.Style, "view">>;

let current_fractal = Compile("Line 1");
let current_config:StyleConfig = {strokeColor: new paper.Color(0, 0, 0), strokeWidth: 1};
let current_path = Draw(current_fractal, current_config);
center(current_path);

function Draw(fractal:Fractal, config:StyleConfig):paper.Path {
	let p:paper.Path;
	console.groupCollapsed("subdraw");
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
					rotation -= value; //counterclockwise is better.
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
					partial_path.remove();
					p.addSegments(partial_path.segments.slice(1));
					position = partial_path.lastSegment.point;
					break;
				}
				case "absoluteline": {
					console.log("Drawing depth-ignorant line");
					const lastSegment = p.segments.at(-1);
					const newSegment = new paper.Segment({
						point: lastSegment.point.add(new paper.Point(
							scale * value * Math.cos(rotation*Math.PI/180),
							scale * value * Math.sin(rotation*Math.PI/180),
						)),
					});
					p.addSegments([newSegment]);
					break;
				}
				default: {
					console.log("Unknown command; skipping");
				}
			}
		}
	}
	console.groupEnd();
	return p;
}

function center(path:paper.Path):void {
	let translateFactor:paper.Point = path.lastSegment.point.subtract(path.firstSegment.point).divide(2);
	path.position = path.position.subtract(translateFactor);
}

function redraw():void {
	paper.project.activeLayer.removeChildren();
	current_path = Draw(current_fractal, current_config);
	center(current_path);
}

$("#fracfile").on("change", function(this:HTMLInputElement) {
	const file = this.files[0];
	file.text().then((data:string) => {
		current_fractal = Compile(data);
		redraw();
	});
});

$("#style").on("submit", function(this:HTMLFormElement, e:JQuery.SubmitEvent) {
	e.preventDefault();
	e.stopPropagation();
	let old_config:StyleConfig = {...current_config};
	current_config.strokeWidth = +($("#width") as JQuery<HTMLInputElement>).val();
	if (!Object.keys(old_config).map((k:keyof StyleConfig) => old_config[k] === current_config[k]).reduce((a,b)=>a&&b,true)) {
		redraw();
	} 
	return false;
});