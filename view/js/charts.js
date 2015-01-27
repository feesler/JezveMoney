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


	// Histogram constructor
	function Histogram(params)
	{
		var containerObj = null;
		var chartsWrapObj = null;
		var chart = null;
		var chartContent = null;
		var vert_labels = null;
		var r = null;
		var lr = null;
		var paperHeight = 300;
		var hLabelsHeight = 20;
		var vLabelsWidth = 10;
		var chartMarginTop = 10;
		var barMargin = 10;
		var barWidth = 0;
		var chartOffset = 0;
		var chartWidth = 0;
		var chartHeight = 0;
		var chartContentWidth;
		var data = {};
		var bars = [];
		var gridLines = [];
		var vertLabels = [];
		var textStyle;
		var fitToWidth;
		var autoScale;
		var onBarClickCallback = null;
		var onScrollCallback = null;
		var onBarOverCallback = null;
		var onBarOutCallback = null;

		var self = this;


		// Save total width of chart block with labels
		function getChartOffset()
		{
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

			chartWidth = Math.max(paperWidth, chartContentWidth);
		}


		// Set new width for vertical labels block and SVG object
		function setVertLabelsWidth(width)
		{
			var dw;

			if (!lr || !chart)
				return;

			dw = vLabelsWidth - width;

			lr.setSize(width, paperHeight + 20);
			vLabelsWidth = width;

			updateChartWidth();
		}


		// Calculate grid
		function calculateGrid(maxValue, height)
		{
			var gridStepRatio, getHeight;
			var grid = {};

			getHeight = convertRelToAbs(maxValue, height);

			// calculate vertical grid step
			grid.valueStep = 5;
			while((maxValue / grid.valueStep) > 1)
			{
				grid.valueStep *= 10;
			}

			gridStepRatio = Math.floor(height / 50);

			while((maxValue / grid.valueStep) < gridStepRatio)
			{
				grid.valueStep /= 2;
			}

			// calculate y of first grid line
			grid.yFirst = getHeight(maxValue % grid.valueStep) + chartMarginTop;

			// calculate absolute grid step
			grid.steps = Math.floor(maxValue / grid.valueStep);
			grid.yStep = (height - grid.yFirst + chartMarginTop) / grid.steps;

			// calculate first label value
			grid.valueFirst = maxValue - (maxValue % grid.valueStep);

			return grid;
		}


		// Return array of currently visible bars
		function getVisibleBars()
		{
			var vBars = [];
			var bOutWidth, barsOnWidth, firstBar;
			var i, offs = 1;

			if (!chartContent)
				return;

			bOutWidth = barWidth + barMargin;
			barsOnWidth = chartContent.offsetWidth / bOutWidth;
			barsOnWidth = Math.min(bars.length, barsOnWidth + offs);

			firstBar = Math.floor(chartContent.scrollLeft / bOutWidth);
			firstBar = Math.max(0, firstBar - offs);

			for(i = 0; i < barsOnWidth; i++)
			{
				vBars.push(bars[firstBar + i]);
			}

			return vBars;
		}


		// Return array of bars values
		function getBarsValues(bars)
		{
			if (!bars || !isArray(bars))
				return null;

			return bars.map(function(bar)
			{
				return bar.value;
			});
		}


		// Draw vertical labels
		function drawVLabels(grid)
		{
			var curY, val, el, i;

			curY = grid.yFirst;
			val = grid.valueFirst;

			vertLabels.forEach(function(el)
			{
				el.remove();
			});
			vertLabels = [];
			for(i = 0; i <= grid.steps; i++)
			{
				el = lr.text(5, Math.round(curY), val).attr(textStyle);

				vertLabels.push(el);

				bbObj = el.getBBox();
				if (bbObj.width + 10 > vLabelsWidth)
					setVertLabelsWidth(bbObj.width + 10);

				val -= grid.valueStep;

				curY += grid.yStep;
			}
		}


		// Draw grid
		function drawGrid(grid)
		{
			var dashed = { fill : 'none', stroke : '#808080', 'stroke-dasharray' : '- '};
			var i, curY, el;

			curY = grid.yFirst;
			gridLines.forEach(function(el)
			{
				el.remove();
			});
			gridLines = [];
			for(i = 0; i <= grid.steps; i++)
			{
				el = r.path('M0,' + Math.round(curY) + '.5L' + chartWidth + ',' + Math.round(curY) + '.5').attr(dashed).toBack();

				gridLines.push(el);

				curY += grid.yStep;
			}
		}


		// Bar click event handler
		function onBarClick(barRect, val)
		{
			if (onBarClickCallback)
				onBarClickCallback.call(self, barRect, val);
		}


		// Mouse over bar event handler
		function onBarOver(barRect)
		{
			if (onBarOverCallback)
				onBarOverCallback(barRect);
		}


		// Mouse out from bar event handler
		function onBarOut(barRect)
		{
			if (onBarOutCallback)
				onBarOutCallback(barRect);
		}


		// Chart content scroll event handler
		function onScroll(e)
		{
			var vBars, values, el;
			var maxVal, getHeight;
			var grid, curY, val;
			var i;

			if (!autoScale)
				return;

			vBars = getVisibleBars();
			values = getBarsValues(vBars);

			maxVal = getMax(values);
			getHeight = convertRelToAbs(maxVal, chartHeight);

			grid = calculateGrid(maxVal, chartHeight);
			drawVLabels(grid);
			drawGrid(grid);

			updateBarHeight(vBars, getHeight);

			if (onScrollCallback)
				onScrollCallback.call(self);
		}


		// Create bars with default height
		function createBars()
		{
			var leftPos = 0;
			var maxVal, getHeight;

			maxVal = getMax(data.values);
			getHeight = convertRelToAbs(maxVal, chartHeight);

			bars = [];
			data.values.forEach(function(val)
			{
				var barHeight = getHeight(val);

				var bgRect = r.rect(leftPos, chartMarginTop, barWidth, chartHeight);
				bgRect.attr({ fill : "#00bfff", 'fill-opacity' : 0, stroke : 'none' });

				var barRect = r.rect(leftPos, chartHeight - barHeight + chartMarginTop, barWidth, barHeight);
				barRect.attr({ fill : "#00bfff", 'fill-opacity' : 1, stroke : 'none' });

				bgRect.mouseover(onBarOver.bind(this, barRect));
				bgRect.mouseout(onBarOut.bind(this, barRect));
				bgRect.click(onBarClick.bind(this, barRect, val));

				barRect.mouseover(onBarOver.bind(this, barRect));
				barRect.mouseout(onBarOut.bind(this, barRect));
				barRect.click(onBarClick.bind(this, barRect, val));

				bars.push({ rect : barRect, value : val });

				leftPos += barWidth + barMargin;
			});
		}


		// Update height of specified array of bars
		function updateBarHeight(barsArr, getHeight)
		{
			if (!isArray(barsArr) || !isFunction(getHeight))
				return;

			// update height of bars
			barsArr.forEach(function(bar)
			{
				var barHeight;

				barHeight = getHeight(bar.value);

				bar.rect.attr({ y :  chartHeight - barHeight + chartMarginTop, height : barHeight });
			});
		}


		// Create horizontal labels
		function createHLabels()
		{
			var labelShift = 0, lastOffset = 0;
			var lblMarginLeft = 10;

			data.series.forEach(function(val, itemNum)
			{
				var itemDate = val[0];
				var itemsCount = val[1];

				if (lastOffset == 0 || labelShift > lastOffset + lblMarginLeft)
				{
					txtEl = r.text(labelShift, paperHeight - (hLabelsHeight / 2), itemDate).attr(textStyle);

					bbObj = txtEl.getBBox();
					lastOffset = labelShift + bbObj.width;
				}
				labelShift += itemsCount * (barWidth + barMargin);
			});
		}


		// Create bar chart
		function create(params)
		{
			var barRect;
			var maxVal;
			var leftPos = 0, relHeight, barHeight;
			var grid, curY, val;
			var getHeight;
			var el, bbObj;

			if (!params || !params.data || !params.data.values || !params.data.series)
				return;

			data = params.data;

			fitToWidth = params.widthFit || false;
			autoScale = params.autoScale || false;
			paperHeight = params.height || 300;
			onScrollCallback = isFunction(params.onscroll) ? params.onscroll : null;
			onBarClickCallback = isFunction(params.onbarclick) ? params.onbarclick : null;
			onBarOverCallback = isFunction(params.onbarover) ? params.onbarover : null;
			onBarOutCallback = isFunction(params.onbarout) ? params.onbarout : null;

			if (!params.container)
				return;
			containerObj = ge(params.container);
			if (!containerObj)
				return;

			// Vertical labels
			vert_labels = ce('div');

			// Histogram
			chart = ce('div');
			chartContent = ce('div', { className : 'chart_content' }, chart);

			chartsWrapObj = ce('div', { className : 'charts' }, [
									ce('div', { className : 'right_float' }, vert_labels),
									ce('div', { className : 'chart_wrap' }, chartContent) ]);
			containerObj.appendChild(chartsWrapObj);

			chartContent.onscroll = function(e){ onScroll.call(this, e); };

			chartHeight = paperHeight - hLabelsHeight - chartMarginTop;

			barWidth = 38;

			maxVal = getMax(data.values);
			getHeight = convertRelToAbs(maxVal, chartHeight);

			lr = Raphael(vert_labels, vLabelsWidth, paperHeight + 20);

			// create grid
			textStyle = { 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' };

			grid = calculateGrid(maxVal, chartHeight);

			drawVLabels(grid);

			if (fitToWidth)
			{
				barWidth = (chart.parentNode.offsetWidth / (data.values.length + 1));
				if (barWidth > 10)
				{
					barMargin = barWidth / 5;
					barWidth -= barMargin * 4;
				}
				else
				{
					barMargin = 0;
				}
			}

			chartContentWidth = (data.values.length) * (barWidth + barMargin);
			chartWidth = Math.max(chart.offsetWidth, chartContentWidth);

			r = Raphael(chart, chartWidth, paperHeight);

			drawGrid(grid);

			// create bars
			createBars();

			if (autoScale)
			{
				vBars = getVisibleBars();
				values = getBarsValues(vBars);
				maxVal = getMax(values);
				getHeight = convertRelToAbs(maxVal, chartHeight);
				updateBarHeight(vBars, getHeight);

				grid = calculateGrid(maxVal, chartHeight);

				drawVLabels(grid);
				drawGrid(grid);
			}

			// create horizontal labels
			createHLabels();
		}

		create(params);

		// Histogram instance public methods

		// Return charts content elemtnt
		this.getContent = function()
		{
			return chartContent;
		}


		// Return charts wrap element
		this.getWrapObject = function()
		{
			return chartsWrapObj;
		}
	}


	// Global Charts object public methods
	this.createHistogram = function(params)
	{
		return new Histogram(params);
	}
})();
