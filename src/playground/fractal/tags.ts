const re_re:RegExp = /^\/(?<content>.*)\/[dgimsuvy]*$/s;

function template(strings:TemplateStringsArray, ...values:Array<any>) {
	let s = strings[0];
	let i = 0;
	while (i < values.length) {
		let val = values[i];
		let processed:string;
		if (val instanceof RegExp) {
			processed = val.toString();
			let re_match = re_re.exec(processed);
			if (re_match === null) throw new Error("RegExp is busted");
			if (re_match.groups?.content === undefined) throw new Error("RegExp is busted");
			processed = re_match.groups.content;
		} else {
			processed = val.toString();
		}
		s += processed;
		s += strings[++i];
	}
	return s;
}

function re(arg:string):(a:TemplateStringsArray,...b:any[])=>RegExp;
function re(arg0:TemplateStringsArray,...args:any[]):RegExp;

function re(arg0:string|TemplateStringsArray, ...args:any[]) {
	if (arg0 instanceof Array) {
		return new RegExp(template(arg0, ...args));
	} else {
		return (a:TemplateStringsArray, ...b:any[]) => new RegExp(template(a, ...b), args[0]);
	}
}

export {
	re
};