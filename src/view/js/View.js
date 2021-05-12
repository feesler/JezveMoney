'use strict';

/* global ge, copyObject, onReady, Header */

/**
 * View constructor
 */
function View(props) {
    this.props = (typeof props === 'undefined')
        ? {}
        : copyObject(props);

    onReady(this.onReady.bind(this));
}

/**
 * Document ready event handler
 */
View.prototype.onReady = function () {
    this.header = Header.create();
    this.onStart();
};

/**
 * View initialization event handler
 */
View.prototype.onStart = function () { };

/**
 * Clear validation state of block
 * @param {string|Element} block - block to clear validation state
 */
View.prototype.clearBlockValidation = function (block) {
    var blockElem = (typeof block === 'string') ? ge(block) : block;
    if (blockElem && blockElem.classList) {
        blockElem.classList.remove('invalid-block');
    }
};

/**
 * Set invalid state for block
 * @param {string|Element} block - block to invalidate
 */
View.prototype.invalidateBlock = function (block) {
    var blockElem = (typeof block === 'string') ? ge(block) : block;
    if (blockElem && blockElem.classList) {
        blockElem.classList.add('invalid-block');
    }
};

/**
 * Obtain request data of specified form element
 * @param {HTMLFormElement} form - form element to obtain data from
 */
View.prototype.getFormData = function (form) {
    var i;
    var inputEl;
    var res = {};

    if (!form || !form.elements) {
        return null;
    }

    for (i = 0; i < form.elements.length; i += 1) {
        inputEl = form.elements[i];
        if (inputEl.disabled || inputEl.name === '') {
            continue;
        }

        if ((inputEl.type === 'checkbox' || inputEl.type === 'radio')
            && !inputEl.checked) {
            continue;
        }

        res[inputEl.name] = inputEl.value;
    }

    return res;
};
