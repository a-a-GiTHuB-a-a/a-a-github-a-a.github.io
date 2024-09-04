const toc_0 = $("#toc").appendElement("<ol></ol>");
let toc_1;
let toc_2;
let toc_3;
let toc_4;
let toc_5;
let toc_6;
$("h1").each(function() {
	toc_1 = toc_0.appendElement(`<li><a href = "#${$(this).attr("id")}">${$(this).html()}</a></li>`);
});