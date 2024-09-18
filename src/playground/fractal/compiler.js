import {re} from "./tags.js";
import * as AST from "./AST.js";

const ident_re = /[A-Za-z_]+/;
const line_sep_re = /\s*;\s*/m;
const num_re = /[+-]?(?:(?:[0-9]+\.[0-9]*)|(?:[0-9]*\.[0-9]+)|(?:[0-9]+))/;
const var_re = re`^(?<varname>${ident_re})\s*=\s*(?<value>[^=]*)$`;
const cmd_re = re`^(?<cmdname>${ident_re})\\s+(?<value>[^=]*)$`;
const op_list = ["+", "-", "*", "/"];
const op_priorities = {
	["+"]: 1,
	["-"]: 1,
	["*"]: 2,
	["/"]: 2,
	[undefined]: 0,
};

class FracSyntaxError extends Error {
	constructor(line, char, type = "Unknown syntax") {
		super(`${type} at line ${line}, character ${char}`);
		this.name = "SyntaxError";
	}
}

function Parse(expr) {
	let output = [];
	let ops = [];
	let opReady = false;
	let index = 0;
	let line = 1;
	let char = 1;
	let token;
	//part 1: process expression
	while (index < expr.length) {
		if (!opReady && ((token = expr.slice(index).match(re`^${ident_re}`)) !== null)) {
			token = token[0];
			output.push(new AST.VarExpr(token));
			index += token.length;
			char += token.length;
			opReady = true;
		} else if (!opReady && ((token = expr.slice(index).match(re`^${num_re}`)) !== null)) {
			token = token[0];
			output.push(new AST.NumExpr(token));
			index += token.length;
			char += token.length;
			opReady = true;
		} else if (opReady && op_list.includes(token = expr[index])) {
			while (op_priorities[token] <= op_priorities[ops[ops.length-1]]) {
				output.push(ops.pop());
			}
			ops.push(token);
			index++;
			char++;
			opReady = false;
		} else {
			token = expr[index];
			switch (token) {
				case " ": {
					index++;
					char++;
					break;
				}
				case "\n": {
					index++;
					line++;
					break;
				}
				default: {
					throw new FracSyntaxError(line, char);
				}
			}
		}
	}
	//part 1.1: push all the remaining operators to the output
	output.push(...ops.reverse());
	
	//part 2: construct AST
	console.log(output);
	let stacc = [];
	for (let value of output) {
		if (value.constructor.name === "Operator") {
			let b = stacc.pop();
			let a = stacc.pop();
			stacc.push(new AST.BinaryExpr(value, a, b));
		} else {
			stacc.push(value);
		}
	}
	if (stacc.length !== 1) throw new Error("something went horrifically wrong with the arithmetic");
	return stacc[0];
}

function Evaluate(expr, context) {
	return Parse(expr).evaluate(context);
}

function Compile(contents) {
	console.group("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = {
		position: paper.view.center,
		scale: 100,
		depth: 5,
		rotation: 0,
		commands: [],
	};
	let context = {};
	for (let lineIndex in lines) {
		console.groupCollapsed(`Line ${lineIndex}`);
		const line = lines[lineIndex];
		let assign = var_re.exec(line);
		if (assign !== null) {
			console.log("Declaration detected!");
			let value = Evaluate(assign.groups.value, context);
			if (value === undefined) continue;
			switch (assign.groups.varname) {
				case "initialscale":
				case "initial_scale": {
					frac.scale = value;
					break;
				}
				case "depth": {
					frac.depth = value;
					break;
				}
				case "rotation": {
					frac.rotation = value;
					break;
				}
				default: {
					context[assign.groups.varname] = value;
				}
			}
		} else {
			let cmd = cmd_re.exec(line);
			if (cmd !== null) {
				console.log("Command detected!");
				console.log(`Name: ${cmd.groups.cmdname.toLowerCase()}`);
				let value = Evaluate(cmd.groups.value, context);
				if (value === undefined) continue;
				frac.commands.push({
					name: cmd.groups.cmdname.toLowerCase(),
					value: value
				});
			}
		}
		console.log(`Line was ${line}`);
		console.groupEnd();
	}
	console.log("Fractal compiling finished!");
	console.log(frac);
	console.groupEnd();
	return frac;
}

export {
	Compile,
	Evaluate,
	FracSyntaxError
};