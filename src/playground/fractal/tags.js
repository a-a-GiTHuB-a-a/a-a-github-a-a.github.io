function template(strings, ...values) {
	let s = strings[0];
	let i = 0;
	while (i < values.length) {
		let val = values[i];
		if (val.constructor.name === "RegExp") {
			val = val.toString();
			val = val.substring(1, val.length - 1);
		}
		s += val;
		s += strings[++i];
	}
	return s;
}

function re(...args) {
	if (args.length === 1) {
		return (...a) => new RegExp(template(...a), args[0]);
	} else if (args.length === 2) {
		return new RegExp(template(...args));
	}
}

export {
	re
};