import * as code_handler from "./code_handler";

$(function() { //does nothing. i just like having it all bundled up and cozy <3
	/*
		function saveState(saveIfEmpty) {
			if (!languageId)
				return;
			var stateString = languageId;
			var saveTextArea = function(textArea) {
				if (textArea.readOnly)
					return;
				stateString += fieldSeparator + textToByteString(textArea.value);
			}
			iterate($$("#interpreter > textarea, #interpreter > :not([data-mask]) textarea"), saveTextArea);
			iterate($$("#interpreter > [data-mask=false]"), function(element) {
				if ($("textarea", element) === null)
					return;
				stateString += startOfExtraFields + (element.dataset.if || element.dataset.ifNot);
				iterate($$("textarea", element), saveTextArea);
			});
			var settings = getSettings();
			if (settings != "/")
				stateString += startOfSettings + settings.slice(1,-1);
			if (saveIfEmpty || ! rEmptyStateString.test(stateString))
				history.pushState({}, "", "##" + byteStringToBase64(byteArrayToByteString(deflate(stateString))));
		}
	*/
	/*
		All of this code up to generatTIOLink is yoinked code from TIO itself
	*/
	const bufferEncoder = new TextEncoder();
	const bufferDecoder = new TextDecoder();
	const fieldSeparator = "\xff";
	const startOfExtraFields = "\xfe";
	//const startOfSettings = "\xf5";
	const languageId = "lua";
	function iterate<T>(iterable:ArrayLike<T>, monad:(a:T)=>any) {
		if (!iterable)
			return;
		for (var i = 0; i < iterable.length; i++)
			monad(iterable[i]);
	}
	async function deflate(byteString:string):Promise<ArrayBuffer> {
		const outputStream = new Blob([byteString]).stream().pipeThrough(new CompressionStream("deflate"));
		let outputList:Uint8Array<ArrayBuffer>[] = [];
		for await (const chunk of outputStream) {
			outputList.push(chunk);
		}
		const outputArray = await new Blob(outputList).arrayBuffer();
		return outputArray;
	}
	async function inflate(byteString:string):Promise<string> {
		const outputStream = new Blob([byteString]).stream().pipeThrough(new DecompressionStream("deflate"));
		let outputList:Uint8Array<ArrayBuffer>[] = [];
		for await (const chunk of outputStream) {
			outputList.push(chunk);
		}
		const outputArray = await new Blob(outputList).arrayBuffer();
		return bufferDecoder.decode(outputArray);
	}
	function byteArrayToBase64(byteArray:Uint8Array):string {
		// @ts-ignore
		return byteArray.toBase64().replace(/\+/g, "@").replace(/=+/, "");
	}
	function textToByteString(string:string) {
		return unescape(encodeURIComponent(string));
	}
	function byteStringToText(byteString:string) {
		return decodeURIComponent(escape(byteString));
	}
	/**
	 * This function generates a link to TIO.run based on the given code. This function was taken from TIO itself.
	 * @param data All code information required for this function to run.
	 * @returns The URL that links to a TIO instance with the given code.
	 */
	async function generateTIOLink():Promise<string> {
		let stateString = languageId;
		function saveData(data:string) {
			stateString += fieldSeparator + textToByteString(data);
		}
		const saveTextArea = function(textArea:HTMLTextAreaElement) {
			if (textArea.readOnly)
				return;
			saveData(textArea.value);
		}
		saveData(""); //no header
		saveTextArea($("#lua")[0] as HTMLTextAreaElement);
		saveData(""); //no footer (yet)
		saveData(""); //no input (yet)
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
		const deflatedArray = await deflate(stateString);
		console.log(stateString);
		return `https://tio.run/##${byteArrayToBase64(new Uint8Array(deflatedArray))}`;
	}

	for (let char in code_handler.simple_substitutions) {
		$("#chars").append($(`<button class = "symb">${char}</button>`));
	}

	$("#clua").on("input change", function(e) {
		let code = (this as HTMLTextAreaElement).value;
		$("#code-info").text(`${code_handler.count_chars(code)} characters, ${code_handler.count_bytes(code)} bytes`);
	});
	$("#transpile").on("click", function(e:JQuery.ClickEvent) {
		$("#lua").val(code_handler.decompress($("#clua").val().toString()));
	});
	$(".symb").on("click", function(e) {
		let clua = document.getElementById("clua") as HTMLTextAreaElement;
		let char = this.innerText;

		let start = clua.selectionStart;
		let end = clua.selectionEnd;
		let text = clua.value;

		clua.value = text.slice(0, start) + char + text.slice(end);

		// Move cursor after inserted text
		let newPos = start + char.length;
		clua.selectionStart = newPos;
		clua.selectionEnd = newPos;
	});
	$("#tio").on("click", async function(e) {
		window.open(await generateTIOLink(), "_blank");
	});
});