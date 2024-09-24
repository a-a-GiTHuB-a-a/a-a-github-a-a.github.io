$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	buttons.attr("glintPosition", "0%");
	function animate(elem) {
		$({glintPosition: "0%"}).animate({glintPosition: "100%"}, {
			step(val, _) {
				elem.css("background-image", `linear-gradient(90deg, ${elem.css("background-color")}, #9f9f9f ${val}%, ${elem.css("background-color")}`)
			},
			finally() {
				animate(elem);
			}
		});
	}
	buttons.each(function() {animate($(this))});
});