$(function() {
	const buttons = $("button,input[type='button'],input[type='submit']");
	function animate(elem) {
		$({glintPosition: "-10%"}).animate({glintPosition: "110%"}, {
			duration: 1000,
			step(val, _) {
				const color = elem.css("background-color");
				elem.css("background-image", `linear-gradient(90deg, ${color}, ${color} ${val-10}%, #9f9f9f ${val}%, ${color} ${val+10}%, ${color})`)
			}
		});
	}
	buttons.each(function() {
		setInterval(animate, 1500, $(this));
	});
});