import * as code_handler from "./code_handler";
import * as pako from "pako";
import * as msgpack from "../../../../node_modules/@msgpack/msgpack/dist.esm/index";
import {Base64} from "../../../../node_modules/js-base64/base64";

$(function() { //does nothing. i just like having it all bundled up and cozy <3
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	let url = new URL(location.toString());
	let params = url.searchParams;
	try {
		switch (params.get("v")) {
			/*case "2": {
				let byted_string = msgpack.decode(pako.inflateRaw(Base64.toUint8Array(params.get("code")!))) as string;
				let decoded_string = code_handler.decode_sbcs(byted_string);
				$("#clua").val(decoded_string);
				if (params.has("cases")) {
					const cases = JSON.parse(decodeURIComponent(params.get("cases")!));
					for (let [input, output] of cases) {
						let this_case = addCase();
						this_case.children(".input").val(input);
						this_case.children(".output").val(output);
					}
				}
				break;
			}*/
			case "1": {
				$("#clua").val(msgpack.decode(pako.inflateRaw(Base64.toUint8Array(params.get("code")!))) as string);
				if (params.has("cases")) {
					const cases = JSON.parse(decodeURIComponent(params.get("cases")!));
					for (let [input, output] of cases) {
						let this_case = addCase();
						this_case.children(".input").val(input);
						this_case.children(".output").val(output);
					}
				}
				if (params.has("custom-test")) {
					$("#custom-test-footer").val(msgpack.decode(pako.inflateRaw(Base64.toUint8Array(params.get("custom-test")!))) as string);
				}
				if (params.get("custom-test-enabled") === "1") {
					$("#custom-test-toggle").prop("checked", true);
				}
				break;
			}
			case null: {
				$("#clua").val(decodeURIComponent(params.get("code") ?? ""));
				if (params.has("cases")) {
					const cases = JSON.parse(decodeURIComponent(params.get("cases")!));
					for (let [input, output] of cases) {
						let this_case = addCase();
						this_case.children(".input").val(input);
						this_case.children(".output").val(output);
					}
				}
				break;
			}
		}
	} catch (e) {
		console.error("Loading saved code failed!");
		console.trace(e);
	}
	updateLength();

	let categoryColors:Record<code_handler.Category, string|undefined> = {
		"none": undefined,
		"keyword": "#ff7f7f",
		"operator": "#ffff7f",
		"function": "#7fff7f",
	};

	for (let symb of code_handler.simple_substitutions) {
		let button = $(`<button class = "symb" title = 'becomes "${symb.replacement}"'>${symb.character}</button>`);
		let color = categoryColors[symb.category];
		if (color) {
			button.css("background-color", color);
		}
		$("#chars").append(button);
	}

	function saveState() {
		url.searchParams.set("v", "1"); //current version
		let code = $("#clua").val() as string;
		url.searchParams.set("code", Base64.fromUint8Array(pako.deflateRaw(msgpack.encode(code))/*, true*/));

		let cases:string[][] = [];
		$("#cases").children().each((_,el:HTMLElement) => {
			cases.push([$(el).children(".input").val() as string, $(el).children(".output").val() as string]);
		});
		url.searchParams.set("cases", JSON.stringify(cases));

		if ($("#custom-test-toggle").prop("checked")) {
			url.searchParams.set("custom-test-enabled", "1");
		} else {
			url.searchParams.set("custom-test-enabled", "");
		}

		let test:string = $("#custom-test-footer").val() as string;
		url.searchParams.set("custom-test", Base64.fromUint8Array(pako.deflateRaw(msgpack.encode(test))));
		history.pushState({}, "", url); //mmm yes param 2 is "unused" what's even the point???
	}
	$("#save").on("click", saveState);
	/**
	 * This function generates a link to https://ato.pxeger.com/ based on the given code
	 * @returns The ATO link with the given decompressed code.
	 */
	function generateATOLink():string {
		const code_object = code_handler.decompress($("#clua").val() as string);
		let footer:string = code_object.footer ?? "";
		
		if ($("#custom-test-toggle").prop("checked")) {
			footer += $("#custom-test-footer").val() as string;
		} else {
			footer += "\n\nlocal cases = ";
			let cases:string[] = [];
			$("#cases").children().each((_,el:HTMLElement) => {
				cases.push(`{${$(el).children(".input").val()}, ${$(el).children(".output").val()}}`);
			});
			footer += `{${cases.join(",")}}\n\n`;
			footer += `for i,c in ipairs(cases) do print("Case %d: f(%s) == %s -> %s":format(i, prettify(c[1]), prettify(c[2]), prettify(f(c[1]) == c[2]))) end`;
		}

		const dataToSquash:string[] = [
			"lua",
			"", //no options
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
		const b64 = Base64.fromUint8Array(deflatedArray, true); //true for URL-safe
		let params = new URLSearchParams();
		params.set("1", b64);
		return `https://ato.pxeger.com/run?${params}`;
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
	function toggle_custom_testcase(this:HTMLElement) {
		if ($(this).prop("checked")) {
			$(".custom-test-on").show();
			$(".custom-test-off").hide();
		} else {
			$(".custom-test-on").hide();
			$(".custom-test-off").show();
		}
	}
	$("#custom-test-toggle").on("change", toggle_custom_testcase); toggle_custom_testcase.call($("#custom-test-toggle")[0]);
	$("#ato").on("click", function(e) {
		saveState();
		window.open(generateATOLink(), "_blank");
	});
});