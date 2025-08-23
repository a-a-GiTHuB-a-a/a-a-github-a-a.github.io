$(async function() {
	let stub = "https://api.streamelements.com/kappa/v2/speech?voice=Joey&text=";
	let can_convert = true;
	$("#block").on("submit", function(e) {
		e.preventDefault();
		convert($("text"));
		return false;
	});

	async function convert(text) {
		can_convert = false;
		$("button[type=submit]").text("Please wait…");
		setTimeout(() => {
			can_convert = true;
			$("button[type=submit]").text("Create Perfection");
		}, 1);
		if (can_convert) {
			$("#speech").attr("href", stub + text);
		}
	}
});