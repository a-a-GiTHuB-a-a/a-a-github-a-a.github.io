$(function() { //keepin it warm for winter <3
	/**
	 * @param {number} start
	 * @param {number} end
	 * @returns {number[]} The range from `start` to `end` (inclusive).
	 */
	function range(start, end) {
		let arr = [];
		for (let i = start; i <= end; i++) {
			arr.push(i);
		}
		return arr;
	}
	const width = 32;
	const periods = [
		[0,                     -1 ],
		[0, 1,    ...range(- 6, -1)],
		[0, 1,    ...range(- 6, -1)],
		[0, 1, 2, ...range(-15, -1)],
		[0, 1, 2, ...range(-15, -1)],
		[0, 1, 2, ...range(-29, -1)], //we don't segregate in this table…if you're on a phone, DEAL WITH IT
		[0, 1, 2, ...range(-29, -1)],
	];
	$("#table").css("grid-template-columns", `repeat(${width}, 1fr)`);

	$.getJSON("table.json").done(function(periodicData) {
		let atomicNumber = 1;
		periods.forEach((periodArray, rowNumber) => {
			periodArray.forEach((columnNumber) => {
				const period = rowNumber + 1;
				let absoluteColumnNumber = columnNumber + width*(columnNumber < 0);
				let element = periodicData[atomicNumber-1];
				let {name, symbol} = element;
				let elementElement = $(`<div class = "element">
					<data class = "index" value = "${atomicNumber}">${atomicNumber}</data>
					<abbr class = "symbol">${symbol}</abbr>
					<div class = "name">${name}</div>
					<!-- add atomic mass -->
				</div>`);
				elementElement.css("grid-area", `${period} / ${absoluteColumnNumber + 1} / span 1 / span 1`);
				elementElement.appendTo($("#table"));
				atomicNumber++;
			});
		});
	});
});