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

function re(flags) {
	return (...args) => new RegExp(template(...args), flags);
}

export {
	re
};