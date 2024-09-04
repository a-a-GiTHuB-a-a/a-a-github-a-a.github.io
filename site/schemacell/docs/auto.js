const toc_0 = $("#toc").appendElement("<ol></ol>");
let toc_1;
let toc_2;
let toc_3;
let toc_4;
let toc_5;
let toc_6;
$("*").each(function() {
	switch($(this).prop("tagName")) {
		case "h1": {
			toc_1 = $(`<li><a href = "#${$(this).attr("id")}">${$(this).html()}</a></li>`);
			toc_0.appendElement(toc_1);
			break;
		}
		case "h2": {
			toc_2 = $(`<li><a href = "#${$(this).attr("id")}">${$(this).html()}</a></li>`);
			toc_1.appendElement(toc_2);
			break;
		}
	}
});