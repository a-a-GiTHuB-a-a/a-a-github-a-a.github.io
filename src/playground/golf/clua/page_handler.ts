import * as code_handler from "./code_handler";

$("#clua").on("input change", function(e) {
	$("#code-info").text(`${code_handler.count_chars((this as HTMLTextAreaElement).value)} characters, ${code_handler.count_bytes((this as HTMLTextAreaElement).value)} bytes`);
});
$("#transpile").on("click", function(e:JQuery.ClickEvent) {
	$("#lua").val(code_handler.decompress($("#clua").val().toString()));
});