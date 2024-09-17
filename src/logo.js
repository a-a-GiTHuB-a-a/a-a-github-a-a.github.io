$(function() {
	const date = new Date();
	const month = date.getMonth();
	const day = date.getDate();
	let icon;

	if (month === 12 && (24 <= day) && (26 >= day)) {
		icon = "/BOXEN_Logo_Christmas.png";
	} else if (month === 11) {
		icon = "/BOXEN_Logo_Thanksgiving.png";
	} else {
		icon = "/BOXEN_Logo.png";
	}

	$("#favicon").attr("href", icon);
});