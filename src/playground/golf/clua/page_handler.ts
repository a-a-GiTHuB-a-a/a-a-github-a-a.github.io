import * as code_handler from "./code_handler";

$("#clua").on("input change", function(e) {
	let code = (this as HTMLTextAreaElement).value;
	$("#code-info").text(`${code_handler.count_chars(code)} characters, ${code_handler.count_bytes(code)} bytes`);
});
$("#transpile").on("click", function(e:JQuery.ClickEvent) {
	$("#lua").val(code_handler.decompress($("#clua").val().toString()));
});