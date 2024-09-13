$("#newfrac").on("submit", function(e) {
	e.preventDefault();
	e.stopPropagation();
	const file = $("#fracfile")[0].files[0];
	file.text().then((data) => {
		window.current_fractal = Compile(data);
	});
});