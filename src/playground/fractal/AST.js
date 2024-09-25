class Operator {
	constructor(opname, num_args, priority = 0, assoc_left = true) {
		this.name = opname;
		this.num_args = num_args;
		this.priority = priority;
		this.assoc = assoc_left;
	}
}

class SpecialFunction {
	constructor(opname, num_args) {
		this.name = opname;
		this.num_args = num_args;
	}
}

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

class VarExpr {
	constructor(varname) {
		this.varname = varname;
	}

	evaluate(context) {
		return context[this.varname];
	}
}

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