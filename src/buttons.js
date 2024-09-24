$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	function animate(elem) {
		$({glintPosition: "-10"}).animate({glintPosition: "110"}, {
			duration: 1000,
			step(val, _) {
				const color = elem.css("background-color");
				if (val < 0) {
					elem.css("background-image", `linear-gradient(90deg, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				} else if (val > 100) {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%)`);
				} else if (val < 10) {
					elem.css("background-image", `linear-gradient(90deg, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				} else if (val > 90) {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%)`);
				} else {
					elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`);
				}
			}
		});
	}
	buttons.each(function() {
		setInterval(animate, 1500, $(this));
	});
});