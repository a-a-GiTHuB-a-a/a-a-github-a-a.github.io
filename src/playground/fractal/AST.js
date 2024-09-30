/**
 * Represents an operator.
 */
class Operator {
	/**
	 * @constructor
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

	toString() {
		return this.name;
	}

	toJSON() {
		return `Operator("${this.name}")`;
	}
}

/**
 * Represents functions…in the math sense, of course.
 */
class SpecialFunction {
	/**
	 * @constructor
	 * @param {string} name - The name of the function.
	 * @param {*} num_args - The number of arguments of the function.
	 */
	constructor(name, num_args) {
		this.name = name;
		this.num_args = num_args;
	}

	toString() {
		return this.name;
	}

	toJSON() {
		return `SpecialFunction(${this.name})`;
	}
}

/**
 * @callback EvalFunction
 * @param {Object} context - The context from which the expression should be run.
 * @returns {number} - The value returned when the expression is run in this context.
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
	/**
	 * @constructor
	 * @param {string} func - The name of the function.
	 * @param  {...Expression} args - The argument expressions to be passed into the function.
	 */
	constructor(func, ...args) {
		this.func = func;
		this.args = args;
	}

	evaluate(context) {
		switch (this.func.name) {
			case "sqrt": return Math.sqrt(...this.args.map(t => t.evaluate(context)));
		}
	}

	toString() {
		return `${this.name}(${this.args.join(", ")})`;
	}

	toJSON() {
		return `FunctionExpr(${this.name},${this.args.join(",")})`;
	}
}

/**
 * Represents a expression with a binary operator.
 * @implements Expression
 */
class BinaryExpr {
	/**
	 * @constructor
	 * @param {Operator} op - The operator to run on the two expressions.
	 * @param {Expression} expr1 - The first expression.
	 * @param {Expression} expr2 - The second expression.
	 */
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

	toString() {
		return `(${this.expr1}) ${this.op} (${this.expr2})`;
	}

	toJSON() {
		return `BinaryExpr((${this.expr1}) ${this.op} (${this.expr2}))`;
	}
}

/**
 * Represents a variable expression.
 * @implements Expression
 */
class VarExpr {
	/**
	 * @constructor
	 * @param {string} varname - The name of the variable.
	 */
	constructor(varname) {
		this.varname = varname;
	}

	evaluate(context) {
		return context[this.varname];
	}

	toString() {
		return this.varname;
	}

	toJSON() {
		return `VarExpr(${this.varname})`;
	}
}

/**
 * Represents a constant expression.
 * @implements Expression
 */
class NumExpr {
	/**
	 * @constructor
	 * @param {string} num - The number.
	 */
	constructor(num) {
		this.num = num;
	}

	evaluate(context) {
		return +this.num;
	}

	toString() {
		return this.num
	}

	toJSON() {
		return `NumExpr(${this.num})`;
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