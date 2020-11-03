'use strict';

/* global isFunction, ge, ce, svg, addChilds, setParam, re, insertAfter, insertBefore */
/* global prependChild, show, setEmptyClick */
/* exported Popup */

var CLOSE_ICON = 'M 1.1415,2.4266 5.7838,7 1.1415,11.5356 2.4644,12.8585 7,8.2162 11.5734,12.8585 12.8585,11.5356 8.2162,7 12.8585,2.4266 11.5734,1.1415 7,5.7838 2.4644,1.1415 Z';

/** Popup constructor */
var Popup = new (function () {
    // Modal instance constructor
    function Modal(params) {
        var popupObj = null;
        var backObj = null;
        var contentObj = null;
        var boxObj = null;
        var titleObj = null;
        var messageObj = null;
        var controlsObj = null;
        var okBtn = null;
        var cancelBtn = null;
        var closeBtn = null;
        var onCloseHandler = null;
        var props = null;
        var self = this;

        function hideModal() {
            if (!popupObj) {
                return;
            }

            show(popupObj, false);
            document.body.style.overflow = '';

            if (props.closeOnEmptyClick === true) {
                setEmptyClick();
            }
        }

        function closeModal() {
            hideModal();

            if (isFunction(onCloseHandler)) {
                onCloseHandler();
            }
        }

        // Set click handler for close button
        function setOnClose(elem) {
            var btn = (elem) ? elem.firstElementChild : null;
            if (btn) {
                btn.onclick = closeModal.bind(self);
            }
        }

        // Add close button to the popup
        function addCloseButton() {
            if (!boxObj || closeBtn) {
                return;
            }

            closeBtn = ce('button', { className: 'close-btn', type: 'button' },
                svg('svg', {},
                    svg('path', { d: CLOSE_ICON })));
            boxObj.appendChild(closeBtn);

            setOnClose(closeBtn);
        }

        // Remove close button
        function removeCloseButton() {
            re(closeBtn);
            closeBtn = null;
        }

        function setModalContent(content) {
            var newMessageObj;

            if (!content) {
                return false;
            }

            if (typeof content === 'string') {
                newMessageObj = ce(
                    'div',
                    { className: 'popup__message' },
                    ce('div', { innerHTML: content })
                );
            } else {
                newMessageObj = content;
            }

            if (messageObj) {
                insertBefore(newMessageObj, messageObj);
                re(messageObj);
            }

            messageObj = newMessageObj;

            return true;
        }

        function setModalTitle(titleStr) {
            if (!titleStr) {
                return;
            }

            if (!titleObj) {
                titleObj = ce('h1', { className: 'popup__title', textContent: params.title });
                prependChild(boxObj, titleObj);
            }

            titleObj.textContent = titleStr;
        }

        function removeModalTitle() {
            re(titleObj);
            titleObj = null;
        }

        function setModalControls(controlsProps) {
            var newHasControls;

            if (!controlsProps) {
                return false;
            }

            newHasControls = (controlsProps.okBtn !== false || controlsProps.cancelBtn !== false);
            if (newHasControls) {
                if (!controlsObj) {
                    controlsObj = ce('div', { className: 'popup__controls' });
                }
            } else {
                re(controlsObj);
                controlsObj = null;
            }

            if (typeof controlsProps.okBtn !== 'undefined') {
                if (controlsProps.okBtn === false && okBtn) {
                    re(okBtn);
                    okBtn = null;
                } else {
                    if (!okBtn) {
                        okBtn = ce('input', {
                            className: 'btn submit-btn',
                            type: 'button',
                            value: 'ok'
                        });
                    }

                    setParam(okBtn, controlsProps.okBtn);
                }
            }

            if (typeof controlsProps.cancelBtn !== 'undefined') {
                if (controlsProps.cancelBtn === false && cancelBtn) {
                    re(cancelBtn);
                    cancelBtn = null;
                } else {
                    if (!cancelBtn) {
                        cancelBtn = ce('input', {
                            className: 'btn cancel-btn',
                            type: 'button',
                            value: 'cancel',
                            onclick: closeModal.bind(self)
                        });
                    }

                    setParam(cancelBtn, controlsProps.cancelBtn);
                }
            }

            if (newHasControls) {
                addChilds(controlsObj, [okBtn, cancelBtn]);
                insertAfter(controlsObj, messageObj);
            }

            if (typeof controlsProps.closeBtn !== 'undefined') {
                if (controlsProps.closeBtn === true) {
                    addCloseButton();
                } else if (controlsProps.closeBtn === false) {
                    removeCloseButton();
                }
            }

            return true;
        }

        function create(createParams) {
            var addClassNames;

            if (!createParams) {
                return false;
            }

            props = createParams;

            // check popup with same id is already exist
            if ('id' in props) {
                popupObj = ge(props.id);
                if (popupObj) {
                    return false;
                }
            }
            popupObj = ce('div', { className: 'popup hidden' });
            if ('id' in props) {
                popupObj.id = props.id;
            }

            backObj = ce('div', { className: 'popup__back' });
            if (!backObj) {
                return false;
            }

            if (props.nodim === true) {
                show(backObj, false);
            }

            if (isFunction(props.onclose)) {
                this.onCloseHandler = props.onclose;
            }

            if (!setModalContent(props.content)) {
                return false;
            }

            contentObj = ce('div', { className: 'popup__content' });
            boxObj = ce('div', { className: 'popup__content-box' });
            if (!contentObj || !boxObj) {
                return false;
            }

            if (Array.isArray(props.additional) || typeof props.additional === 'string') {
                addClassNames = Array.isArray(props.additional)
                    ? props.additional
                    : props.additional.split(' ');

                addClassNames.forEach(function (item) {
                    contentObj.classList.add(item);
                });
            }

            prependChild(boxObj, messageObj);
            setModalTitle(props.title);
            setModalControls(props.btn);
            contentObj.appendChild(boxObj);
            show(messageObj, true);
            addChilds(popupObj, [backObj, contentObj]);
            document.body.appendChild(popupObj);

            return true;
        }

        function showModal() {
            if (!popupObj) {
                return;
            }

            document.body.style.overflow = 'hidden';
            document.documentElement.scrollTop = 0;
            show(popupObj, true);

            if (props.closeOnEmptyClick === true) {
                setTimeout(function () {
                    setEmptyClick(closeModal.bind(self), [boxObj]);
                });
            }
        }

        function destroyModal() {
            if (popupObj && popupObj.parentNode) {
                popupObj.parentNode.removeChild(popupObj);
            }
            popupObj = null;
        }

        create.call(this, params);

        // Modal public methods
        this.show = function () {
            showModal();
        };

        this.hide = function () {
            hideModal();
        };

        this.close = function () {
            closeModal();
        };

        this.destroy = function () {
            destroyModal();
        };

        this.setTitle = function (titleStr) {
            setModalTitle(titleStr);
        };

        this.removeTitle = function () {
            removeModalTitle();
        };

        this.setContent = function (content) {
            return setModalContent(content);
        };

        this.setControls = function (controls) {
            return setModalControls(controls);
        };
    }

    /* Popup global object public methods */

    /**
     *
     * @param {Object} params:
     * @param {String} params.id - identifier of element will be created for popup
     * @param {boolean} params.nodim - option to not dim background on popup appear
     * @param {Function} params.onclose - popup close event handler
     * @param {String|String[]} params.additional - list of additional CSS classes for popup
     * @param {String} params.title - title of popup
     * @param {Object} params.btn:
     * @param {Object|false} params.btn.okBtn - properties object. Remove if false
     * @param {Object|false} params.btn.cancelBtn - properties object. Remove if false
     * @param {Object|false} params.btn.closeBtn - properties object. Remove if false
     */
    this.create = function (params) {
        return new Modal(params);
    };
})();
