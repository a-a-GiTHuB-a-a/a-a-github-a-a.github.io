$(function() {
	const buttons = $(".btn");
	function animate(elem) {
		$({glintPosition: -animate.width}).animate({glintPosition: 100 + animate.width}, {
			duration: 2000,
			step(val, _) {
				const color = elem.css("background-color");
				if (val < 0) {
					elem.css("background-image", `linear-gradient(90deg, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				} else if (val > 100) {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%)`);
				} else if (val < animate.width) {
					elem.css("background-image", `linear-gradient(90deg, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				} else if (val > (100 - animate.width)) {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%)`);
				} else {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				}
			}
		});
	}
	animate.width = 20;
	buttons.each(function() {
		setInterval(animate, 2500, $(this));
	});
});