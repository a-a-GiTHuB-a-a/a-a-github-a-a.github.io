$(function() {
	const buttons = $("button:hover,input[type='button']:hover,input[type='submit']:hover");
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