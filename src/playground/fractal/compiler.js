import {re} from "./tags.js";
import * as AST from "./AST.js";

const ident_re = /[A-Za-z_]+/;
const line_sep_re = /\s*;\s*/m;
const num_re = /[+-]?(?:(?:[0-9]+\.[0-9]*)|(?:[0-9]*\.[0-9]+)|(?:[0-9]+))/;
const var_re = re`^(?<varname>${ident_re})\\s*=\\s*(?<value>[^=]+)$`;
const cmd_re = re`^(?<cmdname>${ident_re})\\s+(?<value>[^=]+)$`;
const LARGE_GAP = 16;
const op_objs = [
	new AST.Operator("+", 1),
	new AST.Operator("-", 1),
	new AST.Operator("*", 2),
	new AST.Operator("/", 2),
	new AST.Operator("%", 2),
	new AST.Operator("^", 3, 2, false),
	new AST.Operator("(", LARGE_GAP, null, true), //A null value means it's special.
	new AST.Operator(")", -LARGE_GAP, null, true),
];
const function_objs = [
	new AST.SpecialFunction("sqrt", 1),
];

/**
 * A general class for syntax errors in the fractal engine.
 */
class FracSyntaxError extends Error {
	/**
	 * @constructor
	 * @param {number|null} line - The line at which the error occurred.
	 * @param {number|null} char - The character of the line at which the error occurred.
	 * @param {string} type - The type of error found.
	 */
	constructor(line, char, type = "Unknown syntax") {
		let name = type;
		let attributed = false;
		if (line !== null) {
			attributed = true;
			name += ` at line ${line}`;
		}
		if (char !== null) {
			if (attributed) {
				name += `, character ${char}`;
			} else {
				name += ` at line unknown, character ${char}`
			}
		}

		super(name);
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
		console.group("Cycle");
		console.log("Output:", JSON.stringify(output));
		console.log("Operator stack:", JSON.stringify(ops));
		const substr = expr.substring(index);
		if ((token = substr.match(re`^${ident_re}`)) !== null) {
			token = token[0];
			output.push(new AST.VarExpr(token));
			index += token.length;
			char += token.length;
		} else if ((token = substr.match(re`^${num_re}`)) !== null) {
			token = token[0];
			output.push(new AST.NumExpr(token));
			index += token.length;
			char += token.length;
		} else if ((token = op_objs.find(o => expr.substring(index, index + o.name.length) === o.name)) !== undefined) {
			while (
				ops.length &&
				(ops[ops.length - 1].name !== "(") &&
				(
					(token.priority < ops[ops.length-1].priority) ||
					((token.priority === ops[ops.length-1].priority) && token.assoc)
				)
			) {
				output.push(ops.pop());
			}
			if ((token.name === ")") && (ops[ops.length - 1] === "(")) {
				ops.pop();
			}
			if (token.name !== ")") ops.push(token);
			index += token.name.length;
			char += token.name.length;
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
		console.groupEnd();
	}
	//part 1.1: push all the remaining operators to the output
	output.push(...ops.reverse());
	
	console.log("Output stack:", output);
	
	//part 2: construct AST
	let stacc = [];
	for (let value of output) {
		if (value.constructor.name === "Operator") {
			if (value.name === "(") {
				throw new FracSyntaxError(null, null, "mismatched parentheses");
			}
			let b = stacc.pop();
			let a = stacc.pop();
			stacc.push(new AST.BinaryExpr(value, a, b));
		} else {
			stacc.push(value);
		}
	}
	if (stacc.length !== 1) throw new Error("something went horrifically wrong with the arithmetic");
	console.log("Finished compiling. AST:", stacc[0]);
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
		console.log(`Line: ${line}`);
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
		console.groupEnd();
	}
	console.log("Fractal compiling finished!");
	console.log(frac);
	console.groupEnd();
	return frac;
}

export {
	Compile,
	FracSyntaxError,
};