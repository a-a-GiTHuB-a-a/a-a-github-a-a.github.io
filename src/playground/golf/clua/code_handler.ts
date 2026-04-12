export type Category = "none" | "keyword" | "operator" | "function";

/**
 * Represents a single-character symbol which is expanded at transpile-time.
 */
export interface Character {
	character: string;
	replacement: string;
	category: Category;
};

export function symb(...args:[string,string,Category?]):Character {
	return {
		character: args[0],
		replacement: args[1],
		category: args[2] ?? "none",
	};
};

let simple_substitutions:Character[] = [
	symb("λ", " function(", "keyword"),
	symb("¬", " not ", "keyword"),
	symb("∧", " and ", "keyword"),
	symb("∨", " or ", "keyword"),
	symb("∀", " for ", "keyword"),
	symb("…", " while ", "keyword"),
	symb("∈", " in ", "keyword"),
	symb("⟨", " do ", "keyword"),
	symb("¿", " if ", "keyword"),
	symb("ː", " then ", "keyword"),
	symb("ʕ", " elseif ", "keyword"),
	symb("ʔ", " else ", "keyword"),
	symb("⟩", " end ", "keyword"),
	symb("‥", " repeat ", "keyword"),
	symb("¡", " until ", "keyword"),
	symb("→", " return ", "keyword"),
	symb("≡", " == ", "operator"),
	symb("≠", " ~= ", "operator"),
	symb("≥", " >= ", "operator"),
	symb("≤", " <= ", "operator"),
	symb("⫽", " // ", "operator"),
	symb("Μ", " math.max(", "function"),
	symb("µ", " math.min(", "function"),
];
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
	for (let symbol of simple_substitutions) {
		code = code.replaceAll(symbol.character, symbol.replacement);
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