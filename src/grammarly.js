$(function() {
	const grammarly_props = [
		"data-gramm",
		"data-gramm_editor",
		"data-enable-grammarly"
	];
	for (const property of grammarly_props) {
		$(".code,.no-grammar").data(property, "false");
	}
});