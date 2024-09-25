/**
 * Represents an operator.
 */
class Operator {
	/**
	 * Creates an Operator object.
	 * @param {string} name - The name of the operator.
	 * @param {number} priority - The priority the operator has.
	 * @param {number} [num_args=2] - The number of arguments the operator has. Useless as of right now.
	 * @param {boolean} [assoc_left=true] - Whether the operator has left associativity.
	 */
	constructor(name, priority = 0, num_args = 2, assoc_left = true) {
		this.name = name;
		this.num_args = num_args;
		this.priority = priority;
		this.assoc = assoc_left;
	}
}

/**
 * Represents functions…in the math sense, of course.
 */
class SpecialFunction {
	/**
	 * 
	 * @param {string} name - The name of the function.
	 * @param {*} num_args - The number of arguments of the function.
	 */
	constructor(name, num_args) {
		this.name = name;
		this.num_args = num_args;
	}
}

/**
 * @callback EvalFunction
 * @param {Object} context - The context from which the expression should be run.
 * @returns {number} value - The value returned when the expression is run in this context.
 */

/**
 * @interface Expression
 * @property {EvalFunction} evaluate - An evaluation function.
 */

/**
 * Represents a function expression.
 * @implements Expression
 */
class FunctionExpr {
	constructor(func, ...args) {
		this.func = func;
		this.args = args;
	}

	evaluate(context) {
		switch (this.func.name) {
			case "sqrt": return Math.sqrt(...this.args);
		}
	}
}

/**
 * Represents a expression with a binary operator.
 * @implements Expression
 */
class BinaryExpr {
	constructor(op, expr1, expr2) {
		this.op = op;
		this.expr1 = expr1;
		this.expr2 = expr2;
	}

	evaluate(context) {
		const a = this.expr1.evaluate(context);
		const b = this.expr2.evaluate(context);
		switch (this.op.name) {
			case "+": return a + b;
			case "-": return a - b;
			case "*": return a * b;
			case "/": return a / b;
			case "%": return a % b;
			case "^": return a ** b;
		}
	}
}

/**
 * Represents a variable expression.
 * @implements Expression
 */
class VarExpr {
	constructor(varname) {
		this.varname = varname;
	}

	evaluate(context) {
		return context[this.varname];
	}
}

/**
 * Represents a constant expression.
 * @implements Expression
 */
class NumExpr {
	constructor(num) {
		this.num = num;
	}

	evaluate(context) {
		return +this.num;
	}
}

export {
	FunctionExpr,
	BinaryExpr,
	VarExpr,
	NumExpr,
	Operator,
	SpecialFunction,
};