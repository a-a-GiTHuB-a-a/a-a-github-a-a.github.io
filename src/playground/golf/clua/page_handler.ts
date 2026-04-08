import * as code_handler from "./code_handler";
import * as pako from "pako";
import * as msgpack from "../../../../node_modules/@msgpack/msgpack";
import { fromUint8Array } from "../../../../node_modules/js-base64";

$(function() { //does nothing. i just like having it all bundled up and cozy <3
	let url = new URL(location.toString());
	let params = url.searchParams;
	$("#clua").val(decodeURIComponent(params.get("code") ?? ""));
	if (params.has("cases")) {
		const cases = JSON.parse(decodeURIComponent(params.get("cases")!));
		for (let [input, output] of cases) {
			let this_case = addCase();
			this_case.children(".input").val(input);
			this_case.children(".output").val(output);
		}
	}
	function saveState() {
		url.searchParams.set("code", $("#clua").val() as string);

		let cases:string[][] = [];
		$("#cases").children().each((_,el:HTMLElement) => {
			cases.push([$(el).children(".input").val() as string, $(el).children(".output").val() as string]);
		});
		url.searchParams.set("cases", JSON.stringify(cases));
		history.pushState({}, "", url); //mmm yes param 2 is "unused" what's even the point???
	}
	$("#save").on("click", saveState);
	/**
	 * This function generates a link to https://ato.pxeger.com/ based on the given code
	 * @returns The ATO link with the given decompressed code.
	 */
	function generateATOLink():string {
		const code_object = code_handler.decompress($("#clua").val() as string);
		let footer = code_object.footer + "\n\nlocal cases = ";
		let cases:string[] = [];
		$("#cases").children().each((_,el:HTMLElement) => {
			cases.push(`{${$(el).children(".input").val()}, ${$(el).children(".output").val()}}`);
		});
		footer += `{${cases.join(",")}}\n\n`;
		footer += "for _,c in ipairs(cases) do print(f(c[1]) == c[2]) end";
		
		const dataToSquash:any[] = [
			languageId,
			[], //no options
			code_object.header ?? "",
			"utf-8",
			code_object.code,
			"utf-8",
			footer,
			"utf-8",
			"", //who needs arguments
			code_object.input ?? "",
			"utf-8",
		];
		const squashed = msgpack.encode(dataToSquash);
		const deflatedArray = pako.deflateRaw(squashed);
		const b64 = fromUint8Array(deflatedArray, true); //true for URL-safe
		let params = new URLSearchParams();
		params.set("1", b64);
		return `https://ato.pxeger.com/run?${params}`;
	}
	/*
		All of this code up to generateTIOLink is yoinked code from TIO itself
	*/
	const fieldSeparator = "\xff";
	const startOfExtraFields = "\xfe";
	//const startOfSettings = "\xf5";
	const languageId = "lua";

	function deflate(byteString:string):Uint8Array {
		return pako.deflateRaw(byteStringToByteArray(byteString), {"level": 9});
	}
	function inflate(byteString:Uint8Array):string {
		return byteArrayToByteString(pako.inflateRaw(byteString) as Uint8Array);
	}
	function byteStringToByteArray(byteString:string):Uint8Array {
		let byteArray = new Uint8Array(byteString.length);
		for(let index = 0; index < byteString.length; index++)
			byteArray[index] = byteString.charCodeAt(index);
		//byteArray.head = 0;
		return byteArray;
	}
	function byteStringToBase64(byteString:string):string { //I hate you. So. Much. TIO why are you doing this to me.
		return btoa(byteString).replace(/\+/g, "@").replace(/=+/, "");
	}
	function byteArrayToByteString(byteArray:Uint8Array):string {
		let retval = "";
		for (let byte of byteArray) {
			retval += String.fromCharCode(byte);
		}
		return retval;
	}
	function textToByteString(string:string) {
		return unescape(encodeURIComponent(string));
	}
	function byteStringToText(byteString:string) {
		return decodeURIComponent(escape(byteString));
	}
	/**
	 * This function generates a link to TIO.run based on the given code. This function was taken from TIO itself.
	 * @returns The URL that links to a TIO instance with the given code.
	 */
	function generateTIOLink():string {
		const code_object = code_handler.decompress($("#clua").val() as string);
		let stateString = languageId;
		function saveData(data:string) {
			stateString += fieldSeparator + textToByteString(data);
		}
		let footer = code_object.footer + "\n\nlocal cases = ";
		let cases:string[] = [];
		$("#cases").children().each((_,el:HTMLElement) => {
			cases.push(`{${$(el).children(".input").val()}, ${$(el).children(".output").val()}}`);
		});
		footer += `{${cases.join(",")}}\n\n`;
		footer += "for _,c in ipairs(cases) do print(f(c[1]) == c[2]) end";
		saveData(code_object.header ?? "");
		saveData(code_object.code ?? "");
		saveData(footer ?? "");
		saveData(code_object.input ?? "");
		/*iterate($("#interpreter > textarea, #interpreter > :not([data-mask]) textarea"), saveTextArea);
		iterate($("#interpreter > [data-mask=false]"), function(element) {
			if ($("textarea", element) === null)
				return;
			stateString += startOfExtraFields + (element.dataset.if || element.dataset.ifNot);
			iterate($("textarea", element), saveTextArea);
		});*/
		/*var settings = getSettings();
		if (settings != "/")
			stateString += startOfSettings + settings.slice(1,-1);*/
		const deflatedArray = deflate(stateString);
		return `https://tio.run/##${byteStringToBase64(byteArrayToByteString(deflatedArray))}`;
	}

	for (let [char,sub] of Object.entries(code_handler.simple_substitutions)) {
		$("#chars").append($(`<button class = "symb" title = 'becomes "${sub}"'>${char}</button>`));
	}

	function addCase() {
		let element = $(`<div class = "test-case"><textarea class = "code dynamic input"></textarea><div class = "to">⇒</div><textarea class = "code dynamic output"></textarea></div>`).appendTo($("#cases"));
		return disableGrammarly(element);
	}
	$("#add-case").on("click", addCase);

	function updateLength() {
		let code:string = $("#clua").val() as string;
		$("#code-info").text(`${code_handler.count_chars(code)} characters, ${code_handler.count_bytes(code)} bytes`);
	}
	updateLength();
	$("#clua").on("input change", updateLength);
	$(".symb").on("click", function(e) {
		let clua = document.getElementById("clua") as HTMLTextAreaElement;
		let char = this.innerText;

		let start = clua.selectionStart;
		let end = clua.selectionEnd;
		let text = clua.value;

		clua.focus();
		clua.value = text.slice(0, start) + char + text.slice(end);

		// Move cursor after inserted text
		let newPos = start + char.length;
		clua.selectionStart = newPos;
		clua.selectionEnd = newPos;

		updateLength();
	});
	$("#ato").on("click", function(e) {
		saveState();
		window.open(generateATOLink(), "_blank");
	});
	$("#tio").on("click", function(e) {
		saveState();
		window.open(generateTIOLink(), "_blank");
	});
});