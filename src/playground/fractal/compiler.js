import {re} from "./tags.js";
import * as AST from "./AST.js";

const ident_re = /[A-Za-z_]+/;
const line_sep_re = /\s*;\s*/m;
const num_re = /[+-]?(?:(?:[0-9]+\.[0-9]*)|(?:[0-9]*\.[0-9]+)|(?:[0-9]+))/;
const var_re = re`^(?<varname>${ident_re})\\s*=\\s*(?<value>[^=]+)$`;
const cmd_re = re`^(?<cmdname>${ident_re})\\s+(?<value>[^=]+)$`;
const LARGE_GAP = 16;
const op_objs = [
	new AST.Operator("+", 2, 1, true),
	new AST.Operator("-", 2, 1, true),
	new AST.Operator("*", 2, 2, true),
	new AST.Operator("/", 2, 2, true),
	new AST.Operator("%", 2, 2, true),
	new AST.Operator("^", 2, 3, false),
	new AST.Operator("(", null, LARGE_GAP, true), //A null value means it's special.
	new AST.Operator(")", null, -LARGE_GAP, true),
];
const opnames = op_objs.map(a => a.name);
const function_objs = [
	new AST.SpecialFunction("sqrt", 1),
];

class FracSyntaxError extends Error {
	constructor(line, char, type = "Unknown syntax") {
		super(`${type} at line ${line}, character ${char}`);
		this.name = "SyntaxError";
	}
}

function Parse(expr) {
	let output = [];
	let ops = [];
	let index = 0;
	let line = 1;
	let char = 1;
	let token;
	//part 1: process expression
	while (index < expr.length) {
		const substr = expr.substring(index);
		if (token = substr.match(re`^${ident_re}`) !== null) {
			token = token[0];
			output.push(new AST.VarExpr(token));
			index += token.length;
			char += token.length;
		} else if ((token = substr.match(re`^${num_re}`)) !== null) {
			token = token[0];
			output.push(new AST.NumExpr(token));
			index += token.length;
			char += token.length;
		} else if ((token = opnames.find(o => expr.substring(index, index + o.length) === o.name)) !== undefined) {
			while (ops[ops.length - 1] !== "(" && ((token.priority < ops[ops.length-1].priority) || ((token.priority === ops[ops.length-1].priority) && token.assoc))) {
				output.push(ops.pop());
			}
			if ((token.name === ")") && (ops[ops.length - 1] === "(")) {
				ops.pop();
			}
			ops.push(token);
			index += token.opname.length;
			char += token.opname.length;
		} else if ((token = function_objs.find(f => expr.substring(index, index + f.length) === f.name)) !== undefined) {
			ops.push(token);
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

function Compile(contents) {
	console.group("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac = {
		position: paper.view.center,
		scale: 500,
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
			let value = Parse(assign.groups.value);
			if (value === undefined) continue;
			switch (assign.groups.varname) {
				case "scale": {
					frac.scale = value.evaluate({});
					break;
				}
				case "depth": {
					frac.depth = value.evaluate({});
					break;
				}
				case "rotation": {
					frac.rotation = value.evaluate({});
					break;
				}
				default: {
					frac.commands.push({
						name: "assign",
						varname: assign.groups.varname,
						value,
					});
				}
			}
		} else {
			let cmd = cmd_re.exec(line);
			if (cmd !== null) {
				let value = Parse(cmd.groups.value);
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
	FracSyntaxError
};