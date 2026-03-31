let simple_substitutions:Record<string, string> = {
	"λ": " function ",
	"∧": " and ",
	"∨": " or ",
	"⟩": " end ",
	"⟨": " do ",
	"…": " then ",
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
}
export function count_chars(compressed_code:string):number {
	return compressed_code.length;
}

function unpack_symbols(code:string):string {
	for (let [key, value] of Object.entries(simple_substitutions)) {
		code = code.replaceAll(key, value);
	}
	return code;
}

export function decompress(code:string):string {
	let augmented_code = `S=setmetatable p=print s=string s.f=s.format t=table f=function(...) a=arg n=a.n x=a[1] y=a[2] z=a[3] X=a[n] Y=a[n-1] Z=a[n-2] ${code} end`;
	let unpacked_code = unpack_symbols(augmented_code);
	return unpacked_code;
}