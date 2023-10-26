import { isFunction } from '@jezvejs/types';
import { createElement } from '@jezvejs/dom';
import { Component } from 'jezvejs';

import { App } from '../../../Application/App.js';

import { TransactionList } from '../TransactionList/TransactionList.js';

import './TransactionListGroup.scss';

/* CSS classes */
const GROUP_CLASS = 'trans-group';
const HEADER_CLASS = 'trans-group__header';
const HEADER_LINE_CLASS = 'trans-group__header-line';
const TITLE_CLASS = 'trans-group__title';

export class TransactionListGroup extends Component {
    constructor(props = {}) {
        super(props);

        this.state = { ...this.props };

        this.init();
    }

    get id() {
        return this.state.item.date;
    }

    init() {
        this.title = createElement('span', {
            props: { className: TITLE_CLASS },
        });
        this.separator = createElement('hr', {
            props: { className: HEADER_LINE_CLASS },
        });
        this.header = createElement('header', {
            props: { className: HEADER_CLASS },
            children: [
                this.title,
                this.separator,
            ],
        });

        this.list = TransactionList.create({
            listMode: 'list',
            onItemClick: (id, e) => this.onItemClick(id, e),
            onSort: (info) => this.onSort(info),
        });

        this.elem = createElement('section', {
            props: { className: GROUP_CLASS },
            children: [
                this.header,
                this.list.elem,
            ],
        });

        this.render(this.state);
    }

    onItemClick(...args) {
        if (isFunction(this.state.onItemClick)) {
            this.state.onItemClick(...args);
        }
    }

    onSort(...args) {
        if (isFunction(this.state.onSort)) {
            this.state.onSort(...args);
        }
    }

    render(state) {
        this.title.textContent = App.formatDate(state.item.date);

        // Render list
        this.list.setState((listState) => ({
            ...listState,
            mode: state.mode,
            listMode: state.listMode,
            showControls: (state.listMode === 'list'),
            showDate: false,
            items: state.item.items,
            renderTime: state.renderTime,
        }));
    }
}
