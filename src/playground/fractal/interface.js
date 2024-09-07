$("#newfrac").on("submit", async function(e) {
	current_fractal = Compile(await $("#fracfile")[0].files[0].text());
	return false;
});