'use strict';

/* global isFunction, getCursorPos, isNum, fixFloat */

/**
 * Decimal value input
 * @param {Object} props
 */
function DecimalInput(props) {
    this.props = props;

    if (!props.elem) {
        throw new Error('Invalid input element specified');
    }

    this.elem = props.elem;

    this.beforeInputHandler = this.validateInput.bind(this);
    this.elem.addEventListener('keypress', this.beforeInputHandler);
    this.elem.addEventListener('paste', this.beforeInputHandler);
    this.elem.addEventListener('beforeinput', this.beforeInputHandler);

    this.elem.inputMode = 'decimal';

    if (isFunction(props.oninput)) {
        this.inputHandler = this.handleInput.bind(this);
        this.oninput = props.oninput;
        this.elem.addEventListener('input', this.inputHandler);
    }
}

/** Static alias for DecimalInput constructor */
DecimalInput.create = function (props) {
    if (!props || !props.elem) {
        return null;
    }

    return new DecimalInput(props);
};

/** Component destructor: free resources */
DecimalInput.prototype.destroy = function () {
    if (this.beforeInputHandler) {
        this.elem.removeEventListener('keypress', this.beforeInputHandler);
        this.elem.removeEventListener('paste', this.beforeInputHandler);
        this.elem.removeEventListener('beforeinput', this.beforeInputHandler);
        this.beforeInputHandler = null;
    }

    if (this.inputHandler) {
        this.elem.removeEventListener('input', this.inputHandler);
        this.inputHandler = null;
    }
};

/**
 * Replace current selection by specified string or insert it to cursor position
 * @param {string} text - string to insert
 */
DecimalInput.prototype.replaceSelection = function (text) {
    var range = getCursorPos(this.elem);

    var origValue = this.elem.value;
    var beforeSelection = origValue.substr(0, range.start);
    var afterSelection = origValue.substr(range.end);

    return beforeSelection + text + afterSelection;
};

/** Obtain from event input data to be inserted */
DecimalInput.prototype.getInputContent = function (e) {
    if (e.type === 'paste') {
        return (e.clipboardData || window.clipboardData).getData('text');
    }
    if (e.type === 'beforeinput') {
        return e.data;
    }
    if (e.type === 'keypress') {
        return e.key;
    }

    return null;
};

/** Before input events('keypress', 'paste', 'beforeinput) handler */
DecimalInput.prototype.validateInput = function (e) {
    var expectedContent;
    var res;
    var inputContent;

    inputContent = this.getInputContent(e);
    if (!inputContent || inputContent.length === 0) {
        return true;
    }

    expectedContent = this.replaceSelection(inputContent);
    res = isNum(fixFloat(expectedContent));
    if (!res) {
        e.preventDefault();
        e.stopPropagation();
    }

    return res;
};

/** 'input' event handler */
DecimalInput.prototype.handleInput = function (e) {
    if (isFunction(this.oninput)) {
        this.oninput(e);
    }
};

/** Value getter/setter */
Object.defineProperty(DecimalInput.prototype, 'value', {
    get: function () {
        return this.elem.value;
    },

    set: function (value) {
        this.elem.value = value;
    }
});
