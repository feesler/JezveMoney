'use strict';

/* global isObject */
/* exported ChartGrid */

/**
 * Chart grid class constructor
 * @param {Object} props
 * @param {Number} props.height - absolute view height in pixels
 * @param {Number} props.margin - top margin in pixels
 * @param {boolean} props.scaleAroundAxis - if set to true y-axis will be always visible
 * @param {Number} props.minStep - minimum grid step in pixels
 * @param {Number} props.maxStep - maximum grid step in pixels
 */
function ChartGrid(props) {
    var mandatoryProps = ['height', 'margin'];
    var defaultProps = {
        scaleAroundAxis: true,
        valuesMargin: 0,
        minStep: 0,
        maxStep: 0
    };

    this.props = isObject(props) ? props : {};
    // Mandatory properties
    mandatoryProps.forEach(function (propName) {
        if (!(propName in this.props)) {
            throw new Error('Invalid properties: Expected ' + propName);
        }
    }, this);
    this.absMaxVal = this.props.height;
    this.margin = this.props.margin;
    // Optional properties
    Object.keys(defaultProps).forEach(function (propName) {
        this[propName] = (propName in this.props)
            ? this.props[propName]
            : defaultProps[propName];
    }, this);

    this.precision = 0;
    this.valueStep = 1;
    this.valueFirst = 0;
    this.valueLast = 0;
    this.steps = 0;
    this.yFirst = 0;
    this.yLast = 0;
}

/** Round value to specified precision */
ChartGrid.prototype.roundToPrecision = function (value, precision) {
    var prec = parseInt(precision, 10);
    return parseFloat(value.toFixed(prec));
};

/** Calculate exponent order and precision for specified value */
ChartGrid.prototype.getExp = function (value) {
    var val = Math.abs(value);
    var res = {
        precision: 0,
        exponent: 1
    };

    if (val > 1) {
        while (val >= 10) {
            val /= 10;
            res.exponent *= 10;
        }
    } else if (val > 0 && val < 1) {
        while (val < 1) {
            val *= 10;
            res.exponent /= 10;
            res.precision += 1;
        }
        res.exponent = this.roundToPrecision(res.exponent, res.precision);
    }

    return res;
};

/** Return minimum value from array */
ChartGrid.prototype.getMin = function (values) {
    if (!Array.isArray(values)) {
        throw new TypeError('Invalid values. Array is expected');
    }

    return Math.min.apply(null, values);
};

/** Return maximum value from array */
ChartGrid.prototype.getMax = function (values) {
    if (!Array.isArray(values)) {
        throw new TypeError('Invalid values. Array is expected');
    }

    return Math.max.apply(null, values);
};

/** Round value to current grid precision and return number */
ChartGrid.prototype.toPrec = function (value) {
    return this.roundToPrecision(value, this.precision);
};

/** Round value to current grid precision and return string */
ChartGrid.prototype.toPrecString = function (value) {
    return value.toFixed(this.precision);
};

/** Rounds value to nearest less or equal value of current grid order */
ChartGrid.prototype.floor = function (value) {
    var nValue = this.roundToPrecision((value / this.valueStep), 2);
    var res = Math.floor(nValue) * this.valueStep;

    return this.toPrec(res);
};

/** Round value to nearest greater or equal value of current grid order */
ChartGrid.prototype.ceil = function (value) {
    var nValue = this.roundToPrecision((value / this.valueStep), 2);
    var res = Math.ceil(nValue) * this.valueStep;

    return this.toPrec(res);
};

/** Set raw value range to calculate grid steps */
ChartGrid.prototype.setValueRange = function (min, max) {
    var exp;

    this.minValue = Math.min(min, max);
    this.maxValue = Math.max(min, max);
    this.dValue = Math.abs(max - min);

    exp = this.getExp(this.dValue);
    this.valueStep = exp.exponent;
    this.precision = exp.precision;
    // Round values to currend grid order
    this.firstStep = this.ceil(this.maxValue);
    this.lastStep = this.floor(this.minValue);
    this.dStep = this.getStepsHeight();
    // Update view range and adjust count of grid steps
    this.setViewRange(this.lastStep, this.firstStep);
    this.adjustSteps();
};

/** Set view range */
ChartGrid.prototype.setViewRange = function (min, max) {
    this.viewMin = Math.min(min, max);
    this.viewMax = Math.max(min, max);
    this.viewDelta = Math.abs(max - min);

    this.firstStep = this.getFirst();
    this.lastStep = this.getLast();
    this.dStep = this.getStepsHeight();
    this.steps = this.getSteps();
};

/** Increase count of grid steps to be divisible by 4 */
ChartGrid.prototype.adjustSteps = function () {
    var stepsMod;

    while (this.steps < 4) {
        this.splitSteps();
    }

    if (this.steps > 5) {
        stepsMod = (this.steps % 4);
        if (stepsMod > 0) {
            this.addSteps(4 - stepsMod);
        }
    }
};

/** Return value of first grid line */
ChartGrid.prototype.getFirst = function () {
    return this.floor(this.viewMax);
};

/** Return value of last grid line */
ChartGrid.prototype.getLast = function () {
    return this.ceil(this.viewMin);
};

/** Split each grid step by two */
ChartGrid.prototype.splitSteps = function () {
    this.steps *= 2;
    this.valueStep /= 2;
    if (this.valueStep < 1) {
        this.precision += 1;
    }
};

/** Join each two grid step into single one */
ChartGrid.prototype.joinSteps = function () {
    this.steps /= 2;
    this.valueStep *= 2;
};

/** Calculate current count of grid line steps */
ChartGrid.prototype.getSteps = function () {
    return Math.abs(Math.round(this.dStep / this.valueStep));
};

/** Calculate current height between first and last grid line */
ChartGrid.prototype.getStepsHeight = function () {
    return Math.abs(this.firstStep - this.lastStep);
};

/** Returns true in case values are both positive and negative */
ChartGrid.prototype.isBoth = function () {
    return this.minValue < 0 && this.maxValue > 0;
};

/** Returns true in case all values is positive */
ChartGrid.prototype.isPositive = function () {
    return this.minValue >= 0 && this.maxValue > 0;
};

/** Returns true in case all values is negative */
ChartGrid.prototype.isNegative = function () {
    return this.minValue < 0 && this.maxValue <= 0;
};

/** Scale view range of grid by specified count of steps */
ChartGrid.prototype.addSteps = function (steps) {
    var minDelta;
    var maxDelta;

    if (this.scaleAroundAxis && !this.isBoth()) {
        if (this.isPositive()) {
            this.firstStep += steps * this.valueStep;
        } else if (this.isNegative()) {
            this.lastStep -= steps * this.valueStep;
        }
    } else {
        minDelta = Math.abs(this.minValue - this.lastStep);
        maxDelta = Math.abs(this.maxValue - this.firstStep);

        if (minDelta > maxDelta) {
            this.lastStep -= Math.floor(steps / 2) * this.valueStep;
            this.firstStep += Math.ceil(steps / 2) * this.valueStep;
        } else {
            this.lastStep -= Math.ceil(steps / 2) * this.valueStep;
            this.firstStep += Math.floor(steps / 2) * this.valueStep;
        }
    }

    this.setViewRange(this.lastStep, this.firstStep);
};

/** Scale view range of grid */
ChartGrid.prototype.scaleViewRange = function (value) {
    var middle;
    var distance;
    var scaledMin = this.viewMin;
    var scaledMax = this.viewMax;

    if (this.scaleAroundAxis && !this.isBoth()) {
        if (this.isPositive()) {
            scaledMax = this.viewMax * value;
        } else if (this.isNegative()) {
            scaledMin = this.viewMin * value;
        }
    } else {
        middle = (this.dValue / 2) + this.minValue;
        distance = (this.viewDelta * value) / 2;
        scaledMin = middle - distance;
        scaledMax = middle + distance;
    }

    this.setViewRange(scaledMin, scaledMax);
};

/** Convert relative value to absolute */
ChartGrid.prototype.convertRelToAbs = function (value) {
    return this.absMaxVal * ((value - this.viewMin) / this.viewDelta);
};

/** Convert height value from grid to view units */
ChartGrid.prototype.getHeight = function (value) {
    var y0 = this.convertRelToAbs(0);
    var y1 = this.convertRelToAbs(value);
    return Math.abs(y0 - y1);
};

/** Convert y-axis value from grid to view units */
ChartGrid.prototype.getY = function (value) {
    var yAbs = this.convertRelToAbs(value);
    return this.absMaxVal + this.margin - yAbs;
};

/** Calculate grid parameters for specified values */
ChartGrid.prototype.calculate = function (values) {
    var minValue;
    var maxValue;
    var scale;

    if (!values.length) {
        return;
    }

    minValue = this.getMin(values);
    maxValue = this.getMax(values);
    if (this.scaleAroundAxis || values.length === 1) {
        minValue = Math.min(minValue, 0);
        maxValue = Math.max(maxValue, 0);
    }

    this.setValueRange(minValue, maxValue);

    // ajdust view scale if needed
    if (this.valuesMargin > 0) {
        scale = (this.dValue / (1 - this.valuesMargin)) / this.viewDelta;
        this.scaleViewRange(scale);
    }
    // adjust absolute grid step according to settings
    this.yStep = this.getHeight(this.valueStep);
    if (this.maxStep) {
        while (this.yStep > this.maxStep) {
            this.splitSteps();
            this.yStep = this.getHeight(this.valueStep);
        }
    }
    if (this.minStep) {
        while (this.yStep < this.minStep) {
            this.joinSteps();
            this.yStep = this.getHeight(this.valueStep);
        }
    }

    this.valueFirst = this.getFirst();
    this.valueLast = this.getLast();
    this.steps = Math.floor((this.valueFirst - this.viewMin) / this.valueStep);
    this.yFirst = this.getY(this.valueFirst);
    this.yLast = this.getY(this.valueLast);
};
