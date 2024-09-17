$(function() {
	const date = new Date();
	const month = date.getMonth();
	const day = date.getDate();
	let icon;

	if (month === 12 && (24 <= day) && (26 >= day)) {
		icon = "/BOXEN Logo Christmas.png";
	} else if (month === 11) {
		icon = "/BOXEN Logo Thanksgiving.png";
	} else {
		icon = "/BOXEN Logo.png";
	}

	$("#favicon").attr("href", icon);
});