$(function() {
	const grammarly_disabler = {
		"data-gramm": false,
		"data-gramm_editor": false,
		"data-enable-grammarly": false,
		"spellcheck": false,
	};
	$(".code,.no-grammar").attr(grammarly_disabler);
});