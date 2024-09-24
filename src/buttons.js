$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	buttons.attr("glintPosition", "0%");
	function animate() {
		buttons.animate({
			glintPosition: "100%",
		}, {
			step(_, tween) {
				$(this).css("background-image", `linear-gradient(${$(this).css("background-color")}, #9f9f9f ${_}%, ${this.css("background-color")})`)
			},
			finally() {
				$(this).style("glintPosition", "0%");
				animate();
			}
		});
	}
	animate();
});