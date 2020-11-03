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