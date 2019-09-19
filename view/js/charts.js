// Global Charts object
var Charts = new (function()
{
	// Return minimum value from array
	function getMin(arrObj)
	{
		if (!isArray(arrObj))
			return null;

		return Math.min.apply(null, arrObj);
	}


	// Return maximum value from array
	function getMax(arrObj)
	{
		if (!isArray(arrObj))
			return null;

		return Math.max.apply(null, arrObj);
	}


	// Return function to convert relative value to absolute
	function convertRelToAbs(minVal, maxVal, absMaxVal)
	{
		var dVal = Math.abs(maxVal - minVal);

		return function(val)
		{
			return absMaxVal * ((val - minVal) / dVal);
		}
	}


	// Calculate grid
	function calculateGrid(minValue, maxValue, height, margin)
	{
		var gridStepRatio, getHeight;
		var dVal;
		var grid = {};

		getHeight = convertRelToAbs(minValue, maxValue, height);

		dVal = Math.abs(maxValue - minValue);

		// calculate vertical grid step
		grid.valueStep = 5;
		while((dVal / grid.valueStep) > 1)
		{
			grid.valueStep *= 10;
		}

		gridStepRatio = Math.floor(height / 50);

		while((dVal / grid.valueStep) < gridStepRatio)
		{
			grid.valueStep /= 2;
		}

		// calculate first label value
		if (maxValue > 0)
			grid.valueFirst = maxValue - (maxValue % grid.valueStep);
		else
			grid.valueFirst = 0;

		// calculate y of first grid line
		grid.yFirst = height - getHeight(grid.valueFirst) + margin;

		// calculate absolute grid step
		grid.steps = Math.floor(dVal / grid.valueStep);
		grid.yStep = (height - grid.yFirst + margin) / grid.steps;

		return grid;
	}


	// Remove elements
	function removeElements(elems)
	{
		if (!isArray(elems))
			elems = [elems];

		elems.forEach(function(el)
		{
			el.remove();
		});
	}


	// Draw grid and return array of grid lines
	function drawGrid(paper, grid, width)
	{
		var dashed = { fill : 'none', stroke : '#808080', 'stroke-dasharray' : '- '};
		var i, curY, el;
		var lines = [];

		curY = grid.yFirst;
		for(i = 0; i <= grid.steps; i++)
		{
			el = paper.path('M0,' + Math.round(curY) + '.5L' + width + ',' + Math.round(curY) + '.5');
			el.attr(dashed).toBack();

			lines.push(el);

			curY += grid.yStep;
		}

		return lines;
	}


	// Save total width of chart block with labels
	function getChartOffset(chartElem)
	{
		if (!chartElem || !chartElem.parentNode || !chartElem.parentNode.parentNode || !chartElem.parentNode.parentNode.parentNode)
			return null;

		return chartElem.parentNode.parentNode.parentNode.offsetWidth;
	}


	// Return array of values
	function mapValues(items)
	{
		if (!items || !isArray(items))
			return null;

		return items.map(function(item)
		{
			return item.value;
		});
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


		// Update width of chart block
		function updateChartWidth()
		{
			var paperWidth, chartOffset;

			if (!r)
				return;

			chartOffset = getChartOffset(chart);
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


		// Draw vertical labels
		function drawVLabels(paper, grid, textAttr)
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
				el = paper.text(5, Math.round(curY), val).attr(textAttr);

				vertLabels.push(el);

				bbObj = el.getBBox();
				if (bbObj.width + 10 > vLabelsWidth)
					setVertLabelsWidth(bbObj.width + 10);

				val -= grid.valueStep;

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
			var minVal, maxVal, getHeight;
			var grid, curY, val;
			var i;

			if (!autoScale)
				return;

			vBars = getVisibleBars();
			values = mapValues(vBars);

			var zeroBaseValues = values.concat(0);
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);
			drawVLabels(lr, grid, textStyle);
			removeElements(gridLines);
			gridLines = drawGrid(r, grid, chartWidth);

			updateBarHeight(vBars, getHeight);

			if (onScrollCallback)
				onScrollCallback.call(self);
		}


		// Create bars with default height
		function createBars()
		{
			var leftPos = 0;
			var minVal, maxVal, getHeight;

			var zeroBaseValues = data.values.concat(0);
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			var zeroOffset;
			if (minVal < 0 && maxVal > 0)			// both positive and negative values
				zeroOffset = getHeight(0);
			else if (minVal >= 0 && maxVal > 0)		// only positive values
				zeroOffset = getHeight(minVal);
			else if (minVal < 0 && maxVal <= 0)		// only negative values
				zeroOffset = getHeight(maxVal);


			bars = [];
			data.values.forEach(function(val)
			{
				var barAbsVal = getHeight(val);
				var barHeight = Math.abs(barAbsVal - zeroOffset);
				var y = chartHeight + chartMarginTop - Math.max(barAbsVal, zeroOffset);

				var bgRect = r.rect(leftPos, chartMarginTop, barWidth, chartHeight);
				bgRect.attr({ fill : "#00bfff", 'fill-opacity' : 0, stroke : 'none' });

				var barRect = r.rect(leftPos, y, barWidth, barHeight);
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

			var barValues = mapValues(barsArr);

			var zeroBaseValues = barValues.concat(0);
			var minVal = getMin(zeroBaseValues);
			var maxVal = getMax(zeroBaseValues);

			var zeroOffset;
			if (minVal < 0 && maxVal > 0)			// both positive and negative values
				zeroOffset = getHeight(0);
			else if (minVal >= 0 && maxVal > 0)		// only positive values
				zeroOffset = getHeight(minVal);
			else if (minVal < 0 && maxVal <= 0)		// only negative values
				zeroOffset = getHeight(maxVal);

			// update height of bars
			barsArr.forEach(function(bar)
			{
				var barAbsVal = getHeight(bar.value);
				var barHeight = Math.abs(barAbsVal - zeroOffset);
				var newY = chartHeight + chartMarginTop - Math.max(barAbsVal, zeroOffset);

				bar.rect.attr({ y : newY, height : barHeight });
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
			var minVal, maxVal;
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

			var zeroBaseValues = data.values.concat(0);
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			lr = Raphael(vert_labels, vLabelsWidth, paperHeight + 20);

			// create grid
			textStyle = { 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' };

			grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);

			drawVLabels(lr, grid, textStyle);

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

			removeElements(gridLines);
			gridLines = drawGrid(r, grid, chartWidth);

			// create bars
			createBars();

			if (autoScale)
			{
				vBars = getVisibleBars();
				values = mapValues(vBars);

				var zeroBaseValues = values.concat(0);
				minVal = getMin(zeroBaseValues);
				maxVal = getMax(zeroBaseValues);
				getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

				grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);

				drawVLabels(lr, grid, textStyle);
				removeElements(gridLines);
				gridLines = drawGrid(r, grid, chartWidth);

				updateBarHeight(vBars, getHeight);
			}

			// create horizontal labels
			createHLabels();
		}

		create(params);

		// Public methods of instance

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


	// Linechart constructor
	function Linechart(params)
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
		var chartWidth = 0;
		var chartHeight = 0;
		var chartContentWidth;
		var data = {};
		var nodes = [];
		var line = null;
		var gridLines = [];
		var vertLabels = [];
		var textStyle;
		var fitToWidth;
		var autoScale;
		var onNodeClickCallback = null;
		var onScrollCallback = null;
		var onNodeOverCallback = null;
		var onNodeOutCallback = null;

		var self = this;


		// Update width of chart block
		function updateChartWidth()
		{
			var paperWidth, chartOffset;

			if (!r)
				return;

			chartOffset = getChartOffset(chart);
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


		// Return array of currently visible nodes
		function getVisibleNodes()
		{
			var vNodes = [];
			var nOutWidth, nodesOnWidth, firstNode;
			var i, offs = 2;

			if (!chartContent)
				return;

			nOutWidth = barWidth + barMargin;
			nodesOnWidth = Math.round(chartContent.offsetWidth / nOutWidth);
			nodesOnWidth = Math.min(nodes.length, nodesOnWidth + 2*offs);

			firstNode = Math.floor(chartContent.scrollLeft / nOutWidth);
			firstNode = Math.max(0, firstNode - offs);

			if (firstNode + nodesOnWidth >= nodes.length)
				nodesOnWidth = nodes.length - firstNode;

			for(i = 0; i < nodesOnWidth; i++)
			{
				vNodes.push(nodes[firstNode + i]);
			}

			return vNodes;
		}


		// Draw vertical labels
		function drawVLabels(paper, grid, textAttr)
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
				el = paper.text(5, Math.round(curY), val).attr(textAttr);

				vertLabels.push(el);

				bbObj = el.getBBox();
				if (bbObj.width + 10 > vLabelsWidth)
					setVertLabelsWidth(bbObj.width + 10);

				val -= grid.valueStep;

				curY += grid.yStep;
			}
		}


		// Node click event handler
		function onNodeClick(node, val)
		{
			if (onNodeClickCallback)
				onNodeClickCallback.call(self, node, val);
		}


		// Mouse over node event handler
		function onNodeOver(node)
		{
			if (onNodeOverCallback)
				onNodeOverCallback(node);
		}


		// Mouse out from node event handler
		function onNodeOut(node)
		{
			if (onNodeOutCallback)
				onNodeOutCallback(node);
		}


		// Chart content scroll event handler
		function onScroll(e)
		{
			var vNodes, values, el;
			var minVal, maxVal, getHeight;
			var grid, curY, val;
			var i;

			if (!autoScale)
				return;

			vNodes = getVisibleNodes();
			values = mapValues(vNodes);
			var zeroBaseValues = (values.length == 1) ? values.concat(0) : values;
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);
			drawVLabels(lr, grid, textStyle);
			removeElements(gridLines);
			gridLines = drawGrid(r, grid, chartWidth);

			updatePathScale(vNodes, getHeight);

			if (onScrollCallback)
				onScrollCallback.call(self);
		}


		// Draw path currently saved at nodes
		function drawPath()
		{
			var p = '';

			if (line)
				line.remove();

			for(var i = 0, l = nodes.length - 1; i < l; i++)
			{
				var dot = nodes[i].dot;
				var ndot = nodes[i + 1].dot;

				if (!i)
					p += 'M' + dot.x + ',' + dot.y;
				p += 'L' + ndot.x + ',' + ndot.y;
			}

			line = r.path();
			line.attr({ path: p, 'stroke-width' : 3, stroke : '#00bfff' });
			if (nodes.length && nodes[0].node)
				line.insertBefore(nodes[0].node);
		}


		// Create chart path with default height
		function createPath()
		{
			var leftPos = 0;
			var minVal, maxVal, getHeight;

			var zeroBaseValues = (data.values.length == 1) ? data.values.concat(0) : data.values;
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			nodes = [];
			var dw = (barWidth + barMargin) / 2;
			var dotObj;

			data.values.forEach(function(val)
			{
				var barHeight = getHeight(val);

				dotObj = { x : leftPos + dw, y : (chartHeight - barHeight + chartMarginTop) };

				var bgRect = r.rect(leftPos, chartMarginTop, barWidth, chartHeight);
				bgRect.attr({ fill : '#00bfff', 'fill-opacity' : 0, stroke : 'none' });

				var nodeCircle = r.circle(leftPos + dw, (chartHeight - barHeight + chartMarginTop), 4);
				nodeCircle.attr({ fill : '#ffffff', stroke : '#00bfff', 'stroke-width' : 1.5 }).toFront();

				bgRect.mouseover(onNodeOver.bind(this, nodeCircle));
				bgRect.mouseout(onNodeOut.bind(this, nodeCircle));
				bgRect.click(onNodeClick.bind(this, nodeCircle, val));

				nodeCircle.mouseover(onNodeOver.bind(this, nodeCircle));
				nodeCircle.mouseout(onNodeOut.bind(this, nodeCircle));
				nodeCircle.click(onNodeClick.bind(this, nodeCircle, val));

				nodes.push({ node : nodeCircle, value : val, dot : dotObj });

				leftPos += barWidth + barMargin;
			});


			drawPath();
		}


		// Update scale of path
		function updatePathScale(nodesArr, getHeight)
		{
			if (!isArray(nodesArr) || !isFunction(getHeight))
				return;

			// update height of bars
			nodesArr.forEach(function(node)
			{
				var absY;

				absY = getHeight(node.value);

				node.node.attr({ cy :  chartHeight - absY + chartMarginTop });
				node.dot.y = chartHeight - absY + chartMarginTop;
			});

			drawPath();
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
			var minVal, maxVal;
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
			onNodeClickCallback = isFunction(params.onnodeclick) ? params.onnodeclick : null;
			onNodeOverCallback = isFunction(params.onnodeover) ? params.onnodeover : null;
			onNodeOutCallback = isFunction(params.onnodeout) ? params.onnodeout : null;

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

			var zeroBaseValues = (data.values.length == 1) ? data.values.concat(0) : data.values;
			minVal = getMin(zeroBaseValues);
			maxVal = getMax(zeroBaseValues);
			getHeight = convertRelToAbs(minVal, maxVal, chartHeight);

			lr = Raphael(vert_labels, vLabelsWidth, paperHeight + 20);

			// create grid
			textStyle = { 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' };

			grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);

			drawVLabels(lr, grid, textStyle);

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

			removeElements(gridLines);
			gridLines = drawGrid(r, grid, chartWidth);

			// create linechart path
			createPath();

			if (autoScale)
			{
				vNodes = getVisibleNodes();
				values = mapValues(vNodes);

				zeroBaseValues = (values.length == 1) ? values.concat(0) : values;
				minVal = getMin(zeroBaseValues);
				maxVal = getMax(zeroBaseValues);
				getHeight = convertRelToAbs(minVal, maxVal, chartHeight);
				updatePathScale(vNodes, getHeight);

				grid = calculateGrid(minVal, maxVal, chartHeight, chartMarginTop);

				drawVLabels(lr, grid, textStyle);
				removeElements(gridLines);
				gridLines = drawGrid(r, grid, chartWidth);
			}

			// create horizontal labels
			createHLabels();
		}

		create(params);

		// Public methods of instance

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


	this.createLinechart = function(params)
	{
		return new Linechart(params);
	}
})();
