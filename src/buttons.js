$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	buttons.attr("glintPosition", "0%");
	function animate(elem) {
		elem.animate({
			glintPosition: "100%",
		}, {
			step(val, _) {
				$(this).css("background-image", `linear-gradient(${$(this).css("background-color")}, #9f9f9f ${val}%, ${$(this).css("background-color")})`)
			},
			finally() {
				$(this).style("glintPosition", "0%");
				animate($(this));
			}
		});
	}
	animate(buttons);
});