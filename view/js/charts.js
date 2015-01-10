// Global Charts object
var Charts = new (function()
{

	// Return maximum value from array
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


	// Return function to convert relative value to absolute
	function convertRelToAbs(maxVal, absMaxVal)
	{
		return function(val)
		{
			return absMaxVal * (val / maxVal);
		}
	}


	var r, lr = null;
	var paperHeight = 300;
	var vLabelsWidth = 10;
	var barMargin = 10;
	var barWidth;
	var chartOffset;
	var chartContentWidth;



	// Save total width of chart block with labels
	function getChartOffset()
	{
		var chart;

		chart = ge('chart');
		if (!chart || !chart.parentNode || !chart.parentNode.parentNode || !chart.parentNode.parentNode.parentNode)
			return;

		chartOffset = chart.parentNode.parentNode.parentNode.offsetWidth;
	}


	// Update width of chart block
	function updateChartWidth()
	{
		var paperWidth;

		if (!r)
			return;

		getChartOffset();
		paperWidth = Math.max(chartOffset - vLabelsWidth, chartContentWidth);

		r.setSize(paperWidth, paperHeight);
	}


	// Set new width for vertical labels block and SVG object
	function setVertLabelsWidth(width)
	{
		var chart, dw;

		chart = ge('chart');
		if (!lr || !chart)
			return;

		dw = vLabelsWidth - width;

		lr.setSize(width, paperHeight + 20);
		vLabelsWidth = width;

		updateChartWidth();
	}


	// Create bar chart
	function initBarChart(fitToWidth, heightSet)
	{
		var chart, vert_labels, barRect, gridPath;
		var maxVal;
		var leftPos = 0, relHeight, barHeight;
		var hLabelsHeight = 20;
		var chartWidth, chartHeight;
		var dashed, gridY, valStep, gridStepRatio, gridStep;
		var getHeight;
		var txtEl, bbObj, steps;
		var chartMarginTop = 10;

		chart = ge('chart');
		vert_labels = ge('vert_labels');
		if (!chart || !vert_labels || !chartData)
			return;

		paperHeight = heightSet || paperHeight;

		chartHeight = paperHeight - hLabelsHeight - chartMarginTop;
		maxVal = getMax(chartData[0]);
		getHeight = convertRelToAbs(maxVal, chartHeight);

		fitToWidth = fitToWidth || false;
		if (fitToWidth)
			barWidth = (chart.offsetWidth / chartData[0].length) - barMargin;
		else
			barWidth = 38;

		chartContentWidth = (chartData[0].length + 1) * (barWidth + barMargin);
		chartWidth = Math.max(chart.offsetWidth, chartContentWidth);

		r = Raphael('chart', chartWidth, paperHeight);
		lr = Raphael('vert_labels', vLabelsWidth, paperHeight + 20);

		// create grid
		dashed = { fill : 'none', stroke : '#808080', 'stroke-dasharray' : '- '};

		// calculate vertical grid step
		valStep = 5;
		while((maxVal / valStep) > 1)
		{
			valStep *= 10;
		}

		gridStepRatio = Math.floor(chartHeight / 50);

		while((maxVal / valStep) < gridStepRatio)
		{
			valStep /= 2;
		}

		// calculate y of first grid line
		gridY = getHeight(maxVal % valStep) + chartMarginTop;

		// calculate absolute grid step
		steps = Math.floor(maxVal / valStep);
		gridStep = (chartHeight - gridY + chartMarginTop) / steps;

		// calculate first label value
		val = maxVal - (maxVal % valStep);

		for(var i = 0; i <= steps; i++)
		{
			r.path('M0,' + Math.round(gridY) + '.5L' + chartWidth + ',' + Math.round(gridY) + '.5').attr(dashed);

			txtEl = lr.text(5, Math.round(gridY), val).attr({ 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' });

			bbObj = txtEl.getBBox();
			if (bbObj.width + 10 > vLabelsWidth)
				setVertLabelsWidth(bbObj.width + 10);

			val -= valStep;

			gridY += gridStep;
		}

		// create bars
		chartData[0].forEach(function(val)
		{
			barHeight = getHeight(val);

			barRect = r.rect(leftPos, chartHeight - barHeight + chartMarginTop, barWidth, barHeight);
			barRect.attr({ fill : "#00bfff", 'fill-opacity' : 1, stroke : 'none' });

			barRect.mouseover(function()
			{
				this.attr({ fill : '#00ffbf' });
			});

			barRect.mouseout(function()
			{
				this.attr({ fill : '#00bfff' });
			});

			barRect.click(onBarClick.bind(barRect, val));

			leftPos += barWidth + barMargin;
		});


		// create horizontal labels
		labelShift = 0;
		prevCount = 0;
		itemsInGroup = 0;
		chartData[1].forEach(function(val, itemNum)
		{
			itemDate = val[0];
			itemsCount = val[1];

			if ((itemsInGroup % 3) == 0 || prevCount > 1)
			{
				r.text(labelShift, paperHeight - (hLabelsHeight / 2), itemDate).attr({ 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' });
				itemsInGroup = 0;
			}
			labelShift += itemsCount * (barWidth + barMargin);
			prevCount = itemsCount;
			itemsInGroup++;
		});
	}


	// Hide usem menu popup
	function hideChartPopup()
	{
		show('chpopup', false);
		setEmptyClick();
	}


	// Show/hide chart popup by click
	function onBarClick(val)
	{
		var isRelative = true;
		var popupX, popupY;
		var rectBBox, chartsBRect;
		var popup, charts, chart, chartContent;

		popup = ge('chpopup');
		chart = ge('chart');
		if (!popup || !chart)
			return;

		charts = popup.parentNode;
		chartContent = chart.parentNode;
		if (!charts || !chartContent)
			return;

		if (isVisible(popup))
		{
			hideChartPopup();
		}
		else
		{
			show(popup, true);

			e = fixEvent(event);

			charts.style.position = (isRelative) ? 'relative' : '';

			popup.innerHTML = formatCurrency(val, accCurr);

			rectBBox = this.getBBox();
			chartsBRect = charts.getBoundingClientRect();

			chartContent.onscroll = hideChartPopup;

			popupX = rectBBox.x2 - chartContent.scrollLeft + 10;
			popupY = e.clientY - chartsBRect.top - 10;

			if (popup.offsetWidth + popupX > chartsBRect.width)
				popupX -= popup.offsetWidth + rectBBox.width + 20;

			popup.style.left = px(popupX);
			popup.style.top = px(popupY);

			setEmptyClick(hideChartPopup, [this[0]]);
		}
	}

	// Histogram constructor
	function Histogram(params)
	{
		var fitToWidth, heightSet;

		params = params || {};

		fitToWidth = params.widthFit || false;
		heightSet = params.height || undefined;

		initBarChart(fitToWidth, heightSet)

		// Histogram instance public methods
		
	}


	// Global Charts object public methods
	this.createHistogram = function(params)
	{
		return new Histogram(params);
	}
})();
