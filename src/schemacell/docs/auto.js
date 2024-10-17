$(function() {
	const toc_0 = $("#toc").append("<ul></ul>");
	let toc_1;
	let toc_2;
	let toc_3;
	let toc_4;
	let toc_5;
	let toc_6;
	$("*").each(function() {
		switch(this.tagName) {
			case "H1": {
				toc_1 = $(`<li><a href = "#${this.id}" class = "toc-h1">${$(this).html()}</a></li>`);
				toc_0.append(toc_1);
				break;
			}
			case "H2": {
				toc_2 = $(`<li><a href = "#${this.id}" class = "toc-h2">${$(this).html()}</a></li>`);
				toc_1.append(toc_2);
				break;
			}
			case "H3": {
				toc_3 = $(`<li><a href = "#${this.id}" class = "toc-h3">${$(this).html()}</a></li>`);
				toc_2.append(toc_3);
				break;
			}
			case "H4": {
				toc_4 = $(`<li><a href = "#${this.id}" class = "toc-h4">${$(this).html()}</a></li>`);
				toc_3.append(toc_4);
				break;
			}
			case "H5": {
				toc_5 = $(`<li><a href = "#${this.id}" class = "toc-h5">${$(this).html()}</a></li>`);
				toc_4.append(toc_5);
				break;
			}
			case "H6": {
				toc_6 = $(`<li><a href = "#${this.id}" class = "toc-h6">${$(this).html()}</a></li>`);
				toc_5.append(toc_6);
				break;
			}
		}
	});
});