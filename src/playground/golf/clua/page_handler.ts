import * as code_handler from "./code_handler";

$("#clua").on("input change", function(e) {
	$("#code-info").text(`${code_handler.count_chars(this.innerText)} characters, ${code_handler.count_bytes(this.innerText)} bytes`);
});
$("#transpile").on("click", function(e:JQuery.ClickEvent) {
	$("#lua").val(code_handler.decompress($("#clua").val().toString()));
});