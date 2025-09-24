import {Compile, FracSyntaxError, Fractal} from "./compiler";
import {ContextObject} from "./AST";
import paper from "paper";
import $ from "jquery";

paper.setup($("canvas#content")[0] as HTMLCanvasElement);
const tool = new paper.Tool();
tool.activate();

type StyleConfig = Partial<Omit<paper.Style, "view">>;

let current_fractal = Compile("Line 1");
let current_config:StyleConfig = {
	strokeColor: new paper.Color(0xbf, 0x7f, 0xff),
	strokeWidth: 1
};
let current_path = draw_recurse(current_fractal, current_config);
center(current_path);

/**
 * @returns A {@link paper.Point} with the given magnitude and direction.
 * @param magnitude The magnitude of the desired vector.
 * @param direction The angle of the vector in degrees.
 */
function rectangularize(magnitude:number, direction:number):paper.Point {
	return new paper.Point(
		magnitude * Math.cos(direction * Math.PI/180),
		magnitude * Math.sin(direction * Math.PI/180)
	);
}

function Draw(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	console.log("Drawing new fractal!");
	return draw_recurse(fractal, config);
}
function draw_recurse(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	let cluster:paper.CompoundPath;
	console.groupCollapsed("subdraw");
	if (fractal.depth <= 0) {
		console.log("Degenerate case found:", cluster);
		cluster = new paper.CompoundPath({
			children: [new paper.Path.Line({
				from: fractal.position,
				to: fractal.position.add(rectangularize(fractal.scale, fractal.rotation)),
				...config,
			})]
		});
	} else {
		cluster = new paper.CompoundPath(config);
		let {position, scale, depth, rotation, reflected} = fractal;
		let context:ContextObject = {};
		let anchors:Array<{line:number,id:number}> = [];
		depth--;
		let p = new paper.Path({
			segments: [position],
			...config
		});
		for (let index = 0; index < fractal.commands.length; index++) {
			let command = fractal.commands[index];
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
					rotation += value*(Number(reflected)*2-1); //counterclockwise is better.
					break;
				}
				case "line": {
					const partial_path:paper.CompoundPath = draw_recurse({
						...context,
						position,
						rotation,
						depth,
						scale: scale * value,
						reflected,
						commands: fractal.commands,
					}, config);
					let first_child:paper.Path = partial_path.children[0] as paper.Path;
					if (p.lastSegment.point.equals(first_child.firstSegment?.point)) {
						console.log("Welding paths…");
						console.log(p);
						console.log(first_child);
						p.addSegments(first_child.segments.slice(1, first_child.segments.length));
						first_child.remove();
						partial_path.removeChildren(0, 1);
						if (partial_path.lastSegment === null) {
							position = p.lastSegment.point;
						} else {
							position = partial_path.lastSegment.point;
							cluster.addChildren(partial_path.clone({insert: false, deep: true}).children);
						}
					} else {
						console.log(p);
						console.log(first_child);
						cluster.addChild(p);
						position = partial_path.lastSegment.point;
						cluster.addChildren(partial_path.clone({insert: false, deep: true}).children);
						p = new paper.Path({
							segments: [position],
							...config
						});
					}
					partial_path.remove();
					break;
				}
				case "reflectedline":
				case "flippedline":
				case "mirroredline": {
					const partial_path:paper.CompoundPath = draw_recurse({
						...context,
						position,
						rotation,
						depth,
						scale: scale * value,
						reflected: !reflected,
						commands: fractal.commands,
					}, config);
					let first_child:paper.Path = partial_path.children[0] as paper.Path;
					if (p.lastSegment.point.equals(first_child.firstSegment?.point)) {
						console.log("Welding paths…");
						p.addSegments(first_child.segments.slice(1, first_child.segments.length));
						partial_path.removeChildren(0, 1);
						if (partial_path.lastSegment === null) {
							position = p.lastSegment.point;
						} else {
							position = partial_path.lastSegment.point;
							cluster.addChildren(partial_path.clone({insert: false, deep: true}).children);
						}
					} else {
						cluster.addChild(p);
						position = partial_path.lastSegment.point;
						cluster.addChildren(partial_path.clone({insert: false, deep: true}).children);
						p = new paper.Path({
							segments: [position],
							...config
						});
					}
					partial_path.remove();
					break;
				}
				case "absoluteline": {
					console.log("draw_recurseing depth-ignorant line");
					position = position.add(rectangularize(scale * value, rotation));
					const newSegment = new paper.Segment({
						point: position,
					});
					p.addSegments([newSegment]);
					break;
				}
				case "jump": {
					console.log("Jumping");
					cluster.addChild(p);
					position = position.add(rectangularize(scale * value, rotation));
					p = new paper.Path({
						segments: [position],
						...config
					});
					break;
				}
				case "anchor": {
					let anchorpoint = {
						line: index,
						id: value
					};
					let r;
					if ((r = anchors.findIndex((v)=>v.line === index)) !== -1) {
						anchors[r] = anchorpoint;
					} else {
						anchors.push(anchorpoint);
					}
					break;
				}
				case "warp": {
					console.log(`Warping to anchor #${value}`);
					let newLine = anchors.find((v) => v.id === value)?.line;
					if (newLine === undefined) {
						for (let altindex = index; altindex < fractal.commands.length; altindex++) {
							let altcommand = fractal.commands[altindex];
							if (altcommand.name === "anchor") {
								let altvalue = altcommand.value.evaluate({
									...context,
									scale,
									depth,
									rotation,
								});
								let anchorpoint = {
									line: altindex,
									id: altvalue
								};
								let r;
								if ((r = anchors.findIndex((v)=>v.line === altindex)) !== -1) {
									anchors[r] = anchorpoint;
								} else {
									anchors.push(anchorpoint);
								}
								if (altvalue === value) {
									index = altindex;
									break;
								}
							}
						}
						throw new FracSyntaxError(index, null, `No anchor with id ${value} found`);
					}
					index = newLine;
					break;
				}
				default: {
					console.log(`Non-recognized command ${command.name}; skipping`);
				}
			}
		}
		cluster.addChild(p);
		cluster.addChild(new paper.Path(position));
	}
	console.groupEnd();
	return cluster;
}

function center(path:paper.CompoundPath):void {
	let translateFactor:paper.Point = path.lastSegment.point.subtract(path.firstSegment.point).divide(2);
	path.position = path.position.subtract(translateFactor);
}

function redraw():void {
	paper.project.activeLayer.removeChildren();
	current_path = Draw(current_fractal, current_config);
	center(current_path);
}

let oldPointViewCoords:paper.Point;
paper.tool.on("mousedown", function(e:paper.ToolEvent) {
    oldPointViewCoords = paper.view.projectToView(e.point);
});
paper.tool.on("mousedrag", function(e:paper.ToolEvent) {
    const delta = e.point.subtract(paper.view.viewToProject(oldPointViewCoords));
    oldPointViewCoords = paper.view.projectToView(e.point);
    paper.view.translate(delta);
});
const scaleFactor = 1.5;
$("#zoom_in").on("click", function(e:JQuery.ClickEvent) {
	paper.view.scale(scaleFactor);
});
$("#zoom_out").on("click", function(e:JQuery.ClickEvent) {
	paper.view.scale(1/scaleFactor);
});

$("#fracfile").on("change", function(this:HTMLInputElement) {
	const file = this.files[0];
	file.text().then((data:string) => {
		current_fractal = Compile(data);
		redraw();
	});
});

/**
 * Taken from [this Stack Overflow answer]{@link https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number}.
 * @param str A string, possibly containing a number.
 * @returns Whether <code>str</code> is numeric or not.
 */
function isNumeric(str:string):boolean {
	return !isNaN(+str) && !isNaN(parseFloat(str));
}
$("#style").on("submit", function(this:HTMLFormElement, e:JQuery.SubmitEvent) {
	e.preventDefault();
	e.stopPropagation();
	let old_config:StyleConfig = {...current_config};
	let stroke_width_input:JQuery<HTMLInputElement> = $("#width") as JQuery<HTMLInputElement>;
	if (!isNumeric(stroke_width_input.val())) {
		stroke_width_input.trigger("invalid");
		return true;
	}
	current_config.strokeWidth = +stroke_width_input.val();
	if (!Object.keys(old_config).map((k:keyof StyleConfig) => old_config[k] === current_config[k]).reduce((a,b)=>a&&b,true)) {
		redraw();
	} 
	return false;
});