import { createElement, getClassName } from '@jezvejs/dom';

import { App } from '../../../../Application/App.js';

import { ListItem } from '../../../../Components/List/ListItem/ListItem.js';

import './CurrencyItem.scss';

/** CSS classes */
const CONTAINER_CLASS = 'currency-item';
const TITLE_CLASS = 'currency-item__title';

const defaultProps = {
};

/**
 * User currencies list item component
 */
export class CurrencyItem extends ListItem {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(CONTAINER_CLASS, props.className),
        });
    }

    init() {
        super.init();

        this.titleElem = createElement('div', { props: { className: TITLE_CLASS } });
        this.contentElem.append(this.titleElem);
    }

    renderContent(state) {
        const { item } = state;

        const currencyModel = App.model.currency;
        const currency = currencyModel.getItem(item.curr_id);
        if (!currency) {
            return;
        }

        const name = currency.formatName();

        this.titleElem.textContent = name;
        this.titleElem.setAttribute('title', name);
    }
}
