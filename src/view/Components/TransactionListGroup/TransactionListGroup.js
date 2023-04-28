import { Component, createElement, isFunction } from 'jezvejs';
import { TransactionList } from '../TransactionList/TransactionList.js';
import { timeToDate } from '../../js/utils.js';
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

    renderDate(date) {
        return window.app.formatDate(timeToDate(date));
    }

    render(state) {
        this.title.textContent = this.renderDate(state.item.date);

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
