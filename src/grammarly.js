const grammarly_disabler = {
	"data-gramm": false,
	"data-gramm_editor": false,
	"data-enable-grammarly": false,
	"spellcheck": false,
	"autocapitalize": "none",
	"autocorrect": "off",
};
function disableGrammarly(item) {
	return item.attr(grammarly_disabler);
}
$(function() {
	disableGrammarly($(".code,.no-grammar"));
});