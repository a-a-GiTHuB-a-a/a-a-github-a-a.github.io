let simple_substitutions:Record<string, string> = {
	"λ": " function(",
	"¬": " not ",
	"∧": " and ",
	"∨": " or ",
	"⟩": " end ",
	"∀": " for ",
	"…": " while ",
	"∈": " in ",
	"⟨": " do ",
	"¿": " if ",
	"ː": " then ",
	"‥": " repeat ",
	"¡": " until ",
	"→": " return ",
	"≡": " == ",
};
export {simple_substitutions};

export function count_bytes(compressed_code:string):number {
	let s = 0;
	for (let char of compressed_code) {
		if (Object.keys(simple_substitutions).some(k => char === k)) {
			s++;
		} else {
			s += new Blob([char]).size;
		}
	}
	return s;
};
export function count_chars(compressed_code:string):number {
	return compressed_code.length;
};

function unpack_symbols(code:string):string {
	for (let [key, value] of Object.entries(simple_substitutions)) {
		code = code.replaceAll(key, value);
	}
	return code;
}

export interface CodeObject {
	header?: string;
	code: string;
	footer?: string;
	input?: string;
};
export function decompress(code:string):CodeObject {
	let unpacked_code = unpack_symbols(code);
	return {
		header: `S=setmetatable p=print s=string s.f=s.find s.F=s.format T=table f=function(t) if type(t)=="table" then n=#t x=t[1] y=t[2] z=t[3] X=t[n] Y=t[n-1] Z=t[n-2] end`,
		code: unpacked_code,
		footer: "end",
	};
};