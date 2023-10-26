import { isFunction } from '@jezvejs/types';
import {
    createElement,
    getClassName,
    removeChilds,
} from '@jezvejs/dom';
import { Component } from 'jezvejs';

import { COLORS_COUNT } from '../../../utils/utils.js';
import { Transaction } from '../../../Models/Transaction.js';

import './ChartPopup.scss';

/* CSS classes */
const POPUP_CONTENT_CLASS = 'chart-popup__content';
const POPUP_HEADER_CLASS = 'chart-popup__header';
const POPUP_SERIES_CLASS = 'chart-popup__series';
const POPUP_LIST_CLASS = 'chart-popup-list';
const POPUP_LIST_ITEM_CLASS = 'chart-popup-list__item';
const POPUP_LIST_ITEM_CATEGORY_CLASS = 'chart-popup-list__item-cat-';
const POPUP_LIST_VALUE_CLASS = 'chart-popup-list__value';

const defaultProps = {
    formatValue: null,
    renderDateLabel: null,
    reportType: null,
};

/**
 * Histogram chart popup component
 */
export class ChartPopup extends Component {
    static fromTarget(target, props = {}) {
        if (!target) {
            return null;
        }

        const targetData = target.group ?? [target.item];
        const items = targetData.filter((item) => (
            item.columnIndex === target.item.columnIndex
            && item.value !== 0
        ));

        if (items.length === 0) {
            return null;
        }

        const instance = new this({
            ...props,
            ...target,
            items,
        });

        return instance.elem;
    }

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.init();
        this.render(this.props);
    }

    init() {
        this.header = createElement('div', { props: { className: POPUP_HEADER_CLASS } });
        this.series = createElement('div', { props: { className: POPUP_SERIES_CLASS } });
        this.list = createElement('ul', { props: { className: POPUP_LIST_CLASS } });

        this.elem = createElement('div', {
            props: { className: POPUP_CONTENT_CLASS },
            children: [this.header, this.series, this.list],
        });
    }

    formatValue(value) {
        return isFunction(this.props.formatValue)
            ? this.props.formatValue(value)
            : value;
    }

    renderDateLabel(value) {
        return isFunction(this.props.renderDateLabel)
            ? this.props.renderDateLabel(value)
            : value;
    }

    renderPopupListItem(item, state) {
        let { category } = item;
        if (state.reportType !== 'category') {
            category = (item.categoryIndex + 1 > COLORS_COUNT)
                ? (item.columnIndex + 1)
                : (item.categoryIndex + 1);
        }

        const categoryClass = `${POPUP_LIST_ITEM_CATEGORY_CLASS}${category}`;

        return createElement('li', {
            props: { className: getClassName(POPUP_LIST_ITEM_CLASS, categoryClass) },
            children: createElement('span', {
                props: {
                    className: POPUP_LIST_VALUE_CLASS,
                    textContent: this.formatValue(item.value),
                },
            }),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const listItems = state.items.map((item) => this.renderPopupListItem(item, state));
        removeChilds(this.list);
        this.list.append(...listItems);

        this.header.textContent = Transaction.getTypeTitle(state.item.groupName);

        this.series.textContent = this.renderDateLabel(state.series);
    }
}
