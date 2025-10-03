/**
 * Represents an operator.
 */
export class Operator {
	name:string;
	num_args:number|null;
	priority:number;
	assoc:boolean;
	
	constructor(name:string, priority:number = 0, num_args:number|null = 2, assoc_left:boolean = true) {
		this.name = name;
		this.num_args = num_args;
		this.priority = priority;
		this.assoc = assoc_left;
	}
}

/**
 * Represents functions…in the math sense, of course.
 */
export class SpecialFunction {
	name:string;
	comp:(...args:number[]) => number;
	num_args:number;

	/**
	 * Creates a new function type.
	 * @param name The name of the function that can be used in code.
	 * @param comp The evaluator, represented as a native function.
	 * @example `Math.sqrt` for a square-root function
	 * @param num_args The number of arguments the function takes.
	 */
	constructor(name:string, comp:(...args:number[]) => number, num_args:number) {
		this.name = name;
		this.comp = comp;
		this.num_args = num_args;
	}
}

/**
 * Represents a generic value-yielding expression.
 */
export interface Expression {
	evaluate(context:ContextObject): number;
}

export interface ContextObject {
	[varname:string]:number;
}

/**
 * Represents a function expression.
 * @implements Expression
 */
export class FunctionExpr implements Expression {
	func:SpecialFunction;
	args:Array<Expression>;

	constructor(func:SpecialFunction, ...args:Array<Expression>) {
		this.func = func;
		this.args = args;
	}

	evaluate(context:ContextObject):number {
		let args = this.args.map(t => t.evaluate(context));
		return this.func.comp(...args);
	}
}

/**
 * Represents a expression with a binary operator.
 * @implements Expression
 */
export class BinaryExpr implements Expression {
	op:Operator;
	expr1:Expression;
	expr2:Expression;

	constructor(op:Operator, expr1:Expression, expr2:Expression) {
		this.op = op;
		this.expr1 = expr1;
		this.expr2 = expr2;
	}

	evaluate(context:ContextObject):number {
		const a = this.expr1.evaluate(context);
		const b = this.expr2.evaluate(context);
		switch (this.op.name) {
			case "+": return a + b;
			case "-": return a - b;
			case "*": return a * b;
			case "/": {
				if (b === 0) return 0;
				return a / b;
			}
			case "%": return a % b;
			case "^": return a ** b;
		}
		throw new Error("unknown operator");
	}
}

/**
 * Represents a variable expression.
 * @implements Expression
 */
export class VarExpr implements Expression {
	varname:string;

	constructor(varname:string) {
		this.varname = varname;
	}

	evaluate(context:ContextObject):number {
		if (context[this.varname] !== undefined) {
			return context[this.varname];
		}
		throw new Error("unknown variable name");
	}
}

/**
 * Represents a constant expression.
 * @implements Expression
 */
export class NumExpr implements Expression {
	num:number;

	constructor(num:string);
	constructor(num:number);
	constructor(num:string|number) {
		this.num = +num;
	}

	evaluate(context:ContextObject):number {
		return this.num;
	}
}