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

	$.getJSON("table.json").done(function(periodicData) {
		let atomicNumber = 1;
		periods.forEach((periodArray, rowNumber) => {
			periodArray.forEach((columnNumber) => {
				const period = rowNumber + 1;
				let absoluteColumnNumber = columnNumber + 32*(columnNumber < 0);
				let element = periodicData[atomicNumber-1];
				let {elementName, elementSymbol} = element;
				let elementElement = $(`<div class = "element">
					<div class = "symbol">${elementSymbol}</div>
					<div class = "name">${elementName}</div>
				</div>`);
				elementElement.css("grid-area", `${rowNumber} / ${absoluteColumnNumber} / span 1 / span 1`);
				elementElement.appendTo($("#table"));
				atomicNumber++;
			});
		});
	});
});