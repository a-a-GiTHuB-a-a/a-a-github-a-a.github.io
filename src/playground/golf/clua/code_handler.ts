export type Category = "none" | "keyword" | "operator" | "function";

/**
 * Represents a single-character symbol which is expanded at transpile-time.
 */
export interface Character {
	character: string;
	replacement: string;
	category: Category;
	byte: number;
	bytechar: string;
};

export function symb(...args:[string,string,Category,number]):Character {
	return {
		character: args[0],
		replacement: args[1],
		category: args[2],
		byte: args[3],
		bytechar: new TextDecoder().decode(new Uint8Array([args[3]])),
	};
};

let simple_substitutions:Character[] = [
	symb("λ", " function(", "keyword",   1),
	symb("¬", " not ",      "keyword",   2),
	symb("∧", " and ",      "keyword",   3),
	symb("∨", " or ",       "keyword",   4),
	symb("∀", " for ",      "keyword",   5),
	symb("…", " while ",    "keyword",   6),
	symb("∈", " in ",       "keyword",   7),
	symb("⟨", " do ",       "keyword",   8),
	symb("¿", " if ",       "keyword",  11),
	symb("ː", " then ",     "keyword",  12),
	symb("ʕ", " elseif ",   "keyword",  13),
	symb("ʔ", " else ",     "keyword",  14),
	symb("⟩", " end ",      "keyword",  15),
	symb("‥", " repeat ",   "keyword",  16),
	symb("¡", " until ",    "keyword",  17),
	symb("→", " return ",   "keyword",  18),
	symb("≡", " == ",       "operator", 19),
	symb("≠", " ~= ",       "operator", 20),
	symb("≥", " >= ",       "operator", 21),
	symb("≤", " <= ",       "operator", 22),
	symb("⫽", " // ",       "operator", 23),
	symb("Μ", " math.max(", "function", 24),
	symb("µ", " math.min(", "function", 25),
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