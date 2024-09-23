$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	function animate() {
		buttons.animate({
			glintPosition: "100%",
		}, {
			step(_, tween) {
				console.log(tween);
			}
		});
	}
	animate();
});