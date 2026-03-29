import * as code_handler from "./code_handler";

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