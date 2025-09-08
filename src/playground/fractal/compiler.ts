import {regex as re} from "regex";
import * as AST from "./AST";
import paper from "paper";

const ident_re = re`[A-Za-z_]+`;
const line_sep_re = re`\s*;\s*`;
const num_re = re`[\-+]?(?:[0-9]+\.[0-9]*|\.[0-9]+|[0-9]+)`;
const var_re = re`^(?<varname>${ident_re})\s*=\s*(?<value>[^=]+)$`;
const cmd_re = re`^(?<cmdname>${ident_re})\s+(?<value>[^=]+)$`;
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
	new AST.Operator(",", -LARGE_GAP, null, true),
];
const function_objs = [
	new AST.SpecialFunction("sqrt", Math.sqrt, 1),
	new AST.SpecialFunction("abs", Math.abs, 1),
	new AST.SpecialFunction("sin", Math.sin, 1),
	new AST.SpecialFunction("cos", Math.cos, 1),
	new AST.SpecialFunction("tan", Math.tan, 1),
	new AST.SpecialFunction("atan", Math.atan, 1),
	new AST.SpecialFunction("atan2", Math.atan2, 2),
];

/**
 * A general class for syntax errors in the fractal engine.
 */
class FracSyntaxError extends Error {
	constructor(line:number|null, char:number|null, type:string = "Unknown syntax") {
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
				name += ` at unknown line, character ${char}`;
			}
		}

		super(name);
		this.name = "SyntaxError";
	}
}

/**
 * Parses an expression string and spits out an AST.
 */
function Parse(expr:string):AST.Expression {
	let output:Array<AST.Operator|AST.SpecialFunction|AST.Expression> = [];
	let ops:Array<AST.Operator|AST.SpecialFunction> = [];
	let index:number = 0;
	let char:number = 1;
	let token:any;
	//part 1: process expression
	while (index < expr.length) {
		console.groupCollapsed("Cycle");
		console.log("Output:", [...output]);
		console.log("Operator stack:", [...ops]);
		const substr = expr.substring(index);
		if ((token = function_objs.find(f => expr.substring(index, index + f.name.length) === f.name)) !== undefined) {
			ops.push(token);
			index += token.name.length;
			char += token.name.length;
		} else if ((token = substr.match(re`^${ident_re}`)) !== null) {
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
			let last:AST.Operator;
			while (
				ops.length &&
				(ops[ops.length - 1] instanceof AST.Operator) &&
				((last = ops[ops.length - 1] as AST.Operator).name !== "(") &&
				(
					(token.priority < last.priority) ||
					((token.priority === last.priority) && token.assoc)
				)
			) {
				output.push(ops.pop());
			}
			if ((token.name === ")")) {
				if (ops[ops.length - 1].name !== "(") throw new FracSyntaxError(null, char, "mismatched parentheses");
				ops.pop();
				if (ops[ops.length - 1].constructor.name === "SpecialFunction") {
					output.push(ops.pop());
				}
			} else if ((token.name === ",")) {
				//idk man
			} else {
				ops.push(token);
			}
			index += token.name.length;
			char += token.name.length;
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
					char++;
					break;
				}
				default: {
					throw new FracSyntaxError(null, char, "Unknown syntax in expression");
				}
			}
		}
		console.groupEnd();
	}
	//part 1.1: push all the remaining operators to the output
	output.push(...ops.reverse());
	
	console.log("Output stack:", output);
	
	//part 2: construct AST
	let stacc:Array<AST.Expression> = [];
	for (let value of output) {
		if (value instanceof AST.Operator) {
			if (value.name === "(") {
				throw new FracSyntaxError(null, null, "mismatched parentheses");
			}
			let b = stacc.pop();
			let a = stacc.pop();
			stacc.push(new AST.BinaryExpr(value, a, b));
		} else if (value instanceof AST.SpecialFunction) {
			let func = new AST.FunctionExpr(value);
			for (let _ = 0; _ < value.num_args; _++) {
				let arg = stacc.pop();
				if (arg === undefined) {
					throw new FracSyntaxError(null, null, "Insufficient function arguments");
				}
				func.args.unshift(arg);
			}
			stacc.push(func);
		} else {
			stacc.push(value);
		}
	}
	if (stacc.length !== 1) throw new Error("something went horrifically wrong with the arithmetic");
	const initialAST = stacc[0];
	console.log("Finished compiling. AST:", initialAST);
	const optimizedAST = OptimizeExpression(initialAST);
	console.log("AST post-optimization:", optimizedAST);
	return optimizedAST;
}

function OptimizeExpression(expr: AST.Expression):AST.Expression {
	let new_expr:AST.Expression = optimize_cycle(expr);
	while (new_expr !== expr) {
		expr = new_expr;
		new_expr = optimize_cycle(expr);
	}
	return new_expr;
}

function optimize_cycle(expr: AST.Expression):AST.Expression {
	if (expr instanceof AST.BinaryExpr) {
		expr.expr1 = optimize_cycle(expr.expr1);
		expr.expr2 = optimize_cycle(expr.expr2);
		if ((expr.expr1 instanceof AST.NumExpr) && (expr.expr2 instanceof AST.NumExpr)) {
			expr = new AST.NumExpr(expr.evaluate({}).toString());
		}
		return expr;
	} else if (expr instanceof AST.FunctionExpr) {
		expr.args = expr.args.map(optimize_cycle);
		if (expr.args.map(a => a instanceof AST.NumExpr).reduce((a,b)=>a&&b,true)) {
			expr = new AST.NumExpr(expr.evaluate({}).toString());
		}
	}
	return expr;
}

/**
 * An object that represents a drawable fractal.
 * @property {paper.Point} position - The position that the fractal will start at.
 * @property {number} scale - The scale of the fractal.
 * @property {number} depth - The depth that the fractal will recursively check.
 * @property {number} rotation - The current rotation value of the fractal.
 * @property {object[]} commands - The list of commands to execute.
 */
interface Fractal {
	position:paper.Point;
	scale:number;
	depth:number;
	rotation:number;
	reflected:boolean;
	commands:Array<{value: AST.Expression, [key: string]: any}>;
}

function Compile(contents:string):Fractal {
	console.group("Compiling new fractal");
	contents = contents.trim();
	let lines = contents.split(line_sep_re);
	let frac:Fractal = {
		position: paper.view.center,
		scale: 500,
		depth: 5,
		rotation: 0,
		reflected: false,
		commands: [],
	};
	for (let lineIndex in lines) {
		console.groupCollapsed(`Line ${lineIndex}`);
		const line = lines[lineIndex];
		console.log(`Line: ${line}`);
		let assign = var_re.exec(line);
		if (assign !== null) {
			console.log("Declaration detected!");
			let value = Parse(assign.groups?.value as string);
			if (value === undefined) continue;
			switch (assign.groups?.varname as string) {
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
					let parsedLine = {
						name: "assign",
						varname: assign.groups?.varname,
						value,
					};
					console.log("Parsed line:", parsedLine);
					frac.commands.push(parsedLine);
				}
			}
		} else {
			console.log("Command detected!");
			let cmd = cmd_re.exec(line);
			if (cmd !== null) {
				let value = Parse(cmd.groups?.value as string);
				if (value === undefined) continue;
				let parsed_line = {
					name: (cmd.groups?.cmdname as string).toLowerCase(),
					value,
				};
				console.log("Parsed line:", parsed_line);
				frac.commands.push(parsed_line);
			}
		}
		console.groupEnd();
	}
	console.log("Fractal compiling finished! Finished product:");
	console.log(frac);
	console.groupEnd();
	return frac;
}

export {
	Compile,
	FracSyntaxError,
	Fractal,
};