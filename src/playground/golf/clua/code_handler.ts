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

let free_bytes:number[] = [];
for (let i = 0; i <= 31; i++) {
	free_bytes.push(i);
}
free_bytes = free_bytes.filter((v)=>![9.10].includes(v));

export function symb(...args:[string,string,Category,number?]):Character {
	let [character, replacement, category, byte] = args;
	if (typeof byte === "undefined") {
		byte = free_bytes.shift();
		if (byte === undefined) {
			throw new Error("Out of usable bytes! Try to find more unused/pointless ones or trim down useless symbols.");
		}
	}
	return {
		character,
		replacement,
		category,
		byte,
		bytechar: new TextDecoder().decode(new Uint8Array([byte])),
	};
};

let simple_substitutions:Character[] = [
	symb("λ", " function(",       "keyword"),
	symb("¬", " not ",            "keyword",   172), //U+00AC
	symb("∧", " and ",            "keyword"),
	symb("∨", " or ",             "keyword"),
	symb("∀", " for ",            "keyword"),
	symb("…", " while ",          "keyword"),
	symb("∈", " in ",             "keyword"),
	symb("⟨", " do ",             "keyword"),
	symb("¿", " if ",             "keyword"),
	symb("ː", " then ",           "keyword"),
	symb("ʕ", " elseif ",         "keyword"),
	symb("ʔ", " else ",           "keyword"),
	symb("⟩", " end ",            "keyword"),
	symb("‥", " repeat ",         "keyword"),
	symb("¡", " until ",          "keyword",   161), //U+00A1
	symb("→", " return ",         "keyword"),
	symb("≡", " == ",             "operator"),
	symb("≠", " ~= ",             "operator"),
	symb("≥", " >= ",             "operator"),
	symb("≤", " <= ",             "operator"),
	symb("⫽", " // ",             "operator"),
	symb("Μ", " math.max(",       "function"),
	symb("µ", " math.min(",       "function"),
	symb("｜", " math.abs(",       "function"),
	symb("⌊", " math.floor(",     "function"),
	symb("⌈", " math.ceil(",      "function"),
	symb("π", " math.pi ",        "function"),
];
export {simple_substitutions};

export function count_bytes(compressed_code:string):number {
	let s = 0;
	for (let char of compressed_code) {
		if (simple_substitutions.some(s => char === s.character)) {
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

export function encode_sbcs(visual_code:string):string {
	for (let symbol of simple_substitutions) {
		visual_code = visual_code.replace(symbol.character, symbol.bytechar);
	}
	return visual_code;
}
export function decode_sbcs(byted_code:string):string {
	let decoded_string = byted_code;
	for (let symbol of simple_substitutions) {
		decoded_string = decoded_string.replace(symbol.bytechar, symbol.character);
	}
	return decoded_string;
}

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
		header: `S=setmetatable p=print s=string s.f=s.find s.F=s.format T=table f=function(t) if type(t)=="table" then n=#t x=t[1] y=t[2] z=t[3] X=t[n] Y=t[n-1] Z=t[n-2] elseif type(t)=="string" then n=#t end`,
		code: unpacked_code,
		footer: "end",
	};
};