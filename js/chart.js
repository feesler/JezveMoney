
//
function createDataTable()
{
	var data;
	var dataTable, row;

	data = ge('data');
	if (!data || !chartData)
		return;

	dataTable = ce('table');
	if (!dataTable)
		return;

	row = ce('tr', {},
		[
			ce('td', {}, [ ce('b', { innerHTML : 'value' }) ])
		]);
	if (row)
		dataTable.appendChild(row);

	chartData.forEach(function(val)
	{
		row = ce('tr', {},
			[ ce('td', { innerHTML : val }) ]);
		if (row)
			dataTable.appendChild(row);
	});

	data.appendChild(dataTable);
}


function getMax(arrObj)
{
	var res;

	if (!arrObj || !arrObj.length)
		return null;

	res = arrObj[0];
	arrObj.forEach(function(val)
	{
		res = Math.max(res, val);
	});

	return res;
}


//
function createChartsBG()
{
	var chartsbg;
	var bgtable;
	var rowscount = 4;
	var i, rowobj;
	var tWidth = 500, tHeight = 300;
	var cellHeight;
	var maxVal, cellVal;

	chartsbg = ge('chartsbg');
	if (!chartsbg)
		return;
	maxVal = getMax(chartData);
	cellHeight = tHeight / rowscount;

	bgtable = ce('table', { className : 'chartback' });
	for(i = 0, cellVal = maxVal; i < rowscount; i++, cellVal -= (maxVal / rowscount))
	{
		rowobj = ce('tr', {},
				[
					ce('td', { className : 'dash', style : { width : tWidth + 'px', height : cellHeight + 'px' } }),
					ce('td', { className : 'price', innerHTML : cellVal })
				]);
		if (rowobj)
			bgtable.appendChild(rowobj);
	}

	chartsbg.appendChild(bgtable);
}


//
function createCharts(fitToWidth)
{
	var chart, maxVal;
	var leftPos = 0, relHeight, barWidth;
	var barMargin = 5;

	chart = ge('chart');
	if (!chart || !chartData)
		return;
	maxVal = getMax(chartData);

	if (fitToWidth)
		barWidth = (chart.offsetWidth / chartData.length) - barMargin;
	else
		barWidth = 50;

	chartData.forEach(function(val)
	{
		relHeight = (val / (maxVal / 100)) + '%';

		chartblock = ce('div', { className : 'chartbar',
					style :	{ left : leftPos + 'px',
						height : relHeight,
						width : barWidth + 'px' }});
		if (chartblock)
			chart.appendChild(chartblock);

		leftPos += barWidth + barMargin;
	});
}


// Application initialization
function initApp()
{
	//createDataTable();
	createChartsBG();
	createCharts(false);
}
