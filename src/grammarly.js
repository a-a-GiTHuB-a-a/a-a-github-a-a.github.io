$(function() {
	const grammarly_disabler = {
		"data-gramm": false,
		"data-gramm_editor": false,
		"data-enable-grammarly": false,
		"spellcheck": false,
		"autocapitalize": "none",
		"autocorrect": "off",
	};
	$(".code,.no-grammar").attr(grammarly_disabler);
});