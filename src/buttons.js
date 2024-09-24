$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	buttons.attr("glintPosition", "0%");
	function animate(elem) {
		$({glintPosition: "0%"}).animate({glintPosition: "100%"}, {
			duration: 1000,
			step(val, _) {
				elem.css("background-image", `linear-gradient(90deg, ${elem.css("background-color")}, #9f9f9f ${val}%, ${elem.css("background-color")}`)
			}
		});
	}
	buttons.each(function() {
		setInterval(animate, 1500, $(this));
	});
});