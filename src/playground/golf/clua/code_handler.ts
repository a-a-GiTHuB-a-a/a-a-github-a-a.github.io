let simple_subs:Record<string, string> = {
	"λ": " function ",
	"∧": " and ",
	"∨": " or ",
	"⟩": " end ",
	"⟨": " do ",
	"…": " then ",
	"→": " return ",
	"≡": " == ",
};

function count_bytes(compressed_code:string):number {
	let s = 0;
	for (let char of compressed_code) {
		if (char in Object.keys(simple_subs)) {
			s++;
		} else {
			s += new Blob([char]).size;
		}
	}
	return s;
}
function count_chars(compressed_code:string):number {
	return compressed_code.length;
}

function unpack_symbols(code:string):string {
	for (let [key, value] of Object.entries(simple_subs)) {
		code = code.replaceAll(key, value);
	}
	return code;
}

function decompress(code:string):string {
	let augmented_code = `S=setmetatable p=print s=string s.f = s.format t=table function(...) a=arg n=a.n x=a[1] y=a[2] z=a[3] X=a[n] Y=a[n-1] Z=a[n-2] ${code} end`;
	let unpacked_code = unpack_symbols(augmented_code);
	return unpacked_code;
}

export {decompress, count_bytes, count_chars};