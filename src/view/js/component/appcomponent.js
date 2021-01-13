'use strict';

/* global extend, Component */
/* global ce, svg */

/**
 * Base app component constructor
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
function AppComponent() {
    AppComponent.parent.constructor.apply(this, arguments);
}

extend(AppComponent, Component);

/** Create simple container element */
AppComponent.prototype.createContainer = function (elemClass, children, events) {
    return ce('div', { className: elemClass }, children, events);
};

/** Create SVG icon element */
AppComponent.prototype.createIcon = function (icon) {
    var useElem = svg('use');
    var res = svg('svg', {}, useElem);

    useElem.href.baseVal = (icon) ? '#' + icon : '';

    return res;
};

/**
 * Create checkbox container from given input element
 * @param {Element} input - checkbox input element
 * @param {string} elemClass - class for checkbox container element
 * @param {string} title - optional title
 */
AppComponent.prototype.createCheck = function (input, elemClass, title) {
    var childs;

    if (!input) {
        throw new Error('Invalid input element');
    }

    childs = [input];
    if (typeof title === 'string') {
        childs.push(ce('span', { textContent: title }));
    }

    return ce('label', { className: elemClass }, childs);
};

/** Create field element from given input element */
AppComponent.prototype.createField = function (title, input, extraClass) {
    var elemClasses = ['field'];

    if (typeof extraClass === 'string' && extraClass.length > 0) {
        elemClasses.push(extraClass);
    }

    return ce('div', { className: elemClasses.join(' ') }, [
        ce('label', { textContent: title }),
        ce('div', {}, input)
    ]);
};
