$(function() {
	const date = new Date();
	const month = date.getMonth();
	const day = date.getDate();
	let icon;

	if (month === 12 && (24 <= day) && (26 >= day)) {
		icon = "/images/Logo_Christmas.png";
	} else if (month === 11) {
		icon = "/images/Logo_Thanksgiving.png";
	} else {
		icon = "/images/Logo.png";
	}

	$("#favicon").attr("href", icon);
});