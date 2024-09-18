class Operator {
	constructor(opname) {
		this.name = opname;
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
	BinaryExpr,
	VarExpr,
	NumExpr,
	Operator,
};