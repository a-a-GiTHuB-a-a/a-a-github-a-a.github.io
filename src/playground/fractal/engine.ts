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

/**
 * @param past The first path.
 * @param current The second path.
 * @returns A "welded" combination of the two paths.
 */
function weld(past:paper.CompoundPath, current:paper.CompoundPath):paper.CompoundPath {
	console.log("Past:", past.clone({insert: false}).children.map(child => (child as paper.Path).segments));
	console.log("Current:", current.clone({insert: false}).children.map(child => (child as paper.Path).segments));
	let cluster = new paper.CompoundPath({style: past.style, children: past.children.slice(0, -1)});
	let last_old:paper.Path = past.lastChild as paper.Path;
	let first_new:paper.Path = current.firstChild as paper.Path;
	if (last_old.lastSegment.point.equals(first_new.firstSegment?.point)) {
		console.log("Can weld");
		last_old.addSegments(first_new.segments.slice(1, first_new.segments.length));
		cluster.addChild(last_old);
		cluster.addChildren(current.children.slice(1));
		first_new.remove();
	} else {
		cluster.addChild(last_old);
		cluster.addChildren(current.clone({insert: false, deep: true}).children);
	}
	console.log("Combined:", cluster.clone({insert: false}).children.map(child => (child as paper.Path).segments));
	return cluster;
}

function Draw(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	console.log("Drawing new fractal!");
	return draw_recurse(fractal, config);
}
function draw_recurse(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	let cluster:paper.CompoundPath;
	console.groupCollapsed("subdraw");
	if (fractal.depth <= 0) {
		console.log("Degenerate case found");
		cluster = new paper.CompoundPath({
			children: [new paper.Path.Line({
				from: fractal.position,
				to: fractal.position.add(rectangularize(fractal.scale, fractal.rotation)),
				...config,
			})]
		});
	} else {
		let {position, scale, depth, rotation} = fractal;
		cluster = new paper.CompoundPath({children: [new paper.Path([position])], style: config});
		let context:ContextObject = {};
		let anchors:Array<{line:number,id:number}> = [];
		depth--;
		for (let index = 0; index < fractal.commands.length; index++) {
			let command = fractal.commands[index];
			let value = command.value.evaluate({
				...context,
				scale,
				depth,
			});
			switch (command.name) {
				case "assign": {
					console.log("Evaluating live assignment");
					context[command.varname] = value;
					break;
				}
				case "rotate": {
					console.log("Rotating by angle", value);
					rotation += value; //counterclockwise is better.
					break;
				}
				case "flippedline":
				case "mirroredline":
				case "flippedmirroredline":
				case "mirroredflippedline":
				case "line": {
					let flipped = command.name.includes("flipped");
					let mirrored = command.name.includes("mirrored");
					let partial_path:paper.CompoundPath = draw_recurse({
						...context,
						position,
						rotation: 0,
						depth,
						scale: 1,
						commands: fractal.commands,
					}, config);
					let endpoint = partial_path.lastSegment.point;
					let diff = endpoint.subtract(position);
					partial_path.rotate(-diff.angle, position);
					partial_path.scale(scale * value / position.getDistance(endpoint), position);
					partial_path.scale(flipped ? -1 : 1, mirrored ? -1 : 1, position.add(endpoint).divide(2));
					partial_path.rotate(rotation, position);
					cluster = weld(cluster, partial_path);
					partial_path.remove();
					break;
				}
				case "absoluteline": {
					console.log("drawing depth-ignorant line");
					position = position.add(rectangularize(scale * value, rotation));
					const newSegment = new paper.Segment({
						point: position,
					});
					cluster = weld(cluster, new paper.CompoundPath({children: newSegment}));
					break;
				}
				case "jump": {
					console.log("Jumping");
					position = position.add(rectangularize(scale * value, rotation));
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
		if (!position.equals(cluster.lastSegment.point)) {
			cluster.addChild(new paper.Path(position));
		}
	}
	console.log("Final product:", cluster);
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