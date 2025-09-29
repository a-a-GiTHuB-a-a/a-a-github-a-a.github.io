import {Compile, FracSyntaxError, Fractal} from "./compiler";
import {ContextObject} from "./AST";
import paper from "paper";
import $ from "jquery";

const DEBUG_MODE = false;

paper.setup($("canvas#content")[0] as HTMLCanvasElement);
const tool = new paper.Tool();
tool.activate();
const origin = new paper.Point(0, 0);

type StyleConfig = Partial<Omit<paper.Style, "view">>;

let current_fractal = Compile("Line 1");
let current_config:StyleConfig = {
	strokeColor: new paper.Color(0xbf, 0x7f, 0xff),
	strokeWidth: 1
};
let current_path;

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
 * @param first The first path.
 * @param second The second path.
 * @returns A "welded" combination of the two paths.
 */
function weldCompound(first:paper.CompoundPath, second:paper.CompoundPath):paper.CompoundPath {
	let cluster = new paper.CompoundPath({style: first.style});
	let last_first = first.removeChildren(first.children.length - 1)[0] as paper.Path;
	let first_last = second.removeChildren(0, 1)[0] as paper.Path;
	cluster.addChildren([...first.children, ...weldRaw(last_first, first_last).children, ...second.children]);
	first.remove();
	second.remove();
	return cluster;
}

function weldRaw(first:paper.Path, second:paper.Path):paper.CompoundPath {
	let union = new paper.CompoundPath({style: first.style});
	if (first.lastSegment.point.equals(second.firstSegment.point)) {
		first.addSegments(second.segments.slice(1));
		union.addChild(first);
	} else {
		union.addChildren([first, second]);
	}
	return union;
}

type Formattable = paper.Item|paper.Segment|paper.Point|Array<Formattable>;
function formatItem(thing:Formattable):string {
	if (thing instanceof paper.CompoundPath) {
		return formatItem(thing.children);
	} else if (thing instanceof paper.Path) {
		return thing.segments.map(formatItem).join("--");
	} else if (thing instanceof paper.Segment) {
		return formatItem(thing.point);
	} else if (thing instanceof paper.Point) {
		return `(${thing.x},${thing.y})`;
	} else if (thing instanceof paper.Item) {
		return thing.toString();
	} else {
		return `[${thing.map(formatItem).join(",")}]`;
	}
}

function Draw(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	console.log("Drawing new fractal!");
	let result = draw_recurse(fractal, config);
	result.addTo(paper.project);
	if (DEBUG_MODE) console.log("Fractal:", formatItem(result));
	return result;
}
function draw_recurse(fractal:Fractal, config:StyleConfig):paper.CompoundPath {
	let {position, scale, depth, rotation} = fractal;
	let cluster:paper.CompoundPath;
	console.groupCollapsed("subdraw");
	if (fractal.depth <= 0) {
		console.log("Degenerate case found");
		cluster = new paper.CompoundPath({
			children: [new paper.Path.Line({
				from: position,
				to: position.add(rectangularize(scale, rotation)),
				...config,
			})]
		});
	} else {
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
					rotation -= value; //counterclockwise is better.
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
						position: origin,
						rotation: 0,
						depth,
						scale: 1,
						commands: fractal.commands,
					}, config);
					let endpoint = partial_path.lastSegment.point;
					partial_path.rotate(-endpoint.angle, origin);
					partial_path.scale(scale * value / endpoint.length, origin);
					partial_path.scale(mirrored ? -1 : 1, flipped ? -1 : 1, endpoint.divide(2));
					partial_path.rotate(rotation, origin);
					partial_path.translate(position);
					cluster = weldCompound(cluster, partial_path);
					position = position.add(rectangularize(scale * value, rotation));
					break;
				}
				case "absoluteline": {
					console.log("Drawing depth-ignorant line");
					position = position.add(rectangularize(scale * value, rotation));
					const newSegment = new paper.Segment({
						point: position,
					});
					cluster = weldCompound(cluster, new paper.CompoundPath({children: newSegment}));
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
	cluster.remove();
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
redraw();

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
$(".examplefile").on("click", function(this:HTMLLinkElement, e:JQuery.ClickEvent) {
	e.preventDefault();
	e.stopPropagation();
	$.ajax(this.href, {
		dataType: "string",
	}).done((data) => {
		current_fractal = Compile(data);
		redraw();
	});
});