import {
    createElement,
    Component,
    isFunction,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';
import { __ } from '../../../../utils/utils.js';
import './AccountContainer.scss';

/** CSS classes */
const CONTAINER_CLASS = 'field account-container';
const TITLE_CLASS = 'field__title';
const TILE_BASE_CLASS = 'tile-base';
const INFO_BLOCK_CLASS = 'tile-info-block';
const TOGGLER_CLASS = 'account-toggler';
const TOGGLER_BUTTON_CLASS = 'dashed-btn';
const NO_DATA_MSG_CLASS = 'nodata-message';

const defaultProps = {
    title: null,
    accountToggler: false,
    onToggleAccount: null,
    closeButton: false,
    onClose: null,
    noDataMessage: null,
};

/**
 * Field component
 */
export class AccountContainer extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        this.titleTextElem = createElement('span');
        this.titleElem = createElement('label', {
            props: { className: TITLE_CLASS },
            children: this.titleTextElem,
        });

        if (this.props.closeButton) {
            this.closeButton = CloseButton.create({
                onClick: (e) => this.onClose(e),
            });
            this.titleElem.append(this.closeButton.elem);
        }

        this.infoBlock = createElement('div', { props: { className: INFO_BLOCK_CLASS } });
        this.tileBase = createElement('div', {
            props: { className: TILE_BASE_CLASS },
            children: [
                this.infoBlock,
            ],
        });

        const children = [
            this.titleElem,
            this.tileBase,
        ];

        if (this.props.accountToggler) {
            this.togglerButton = Button.create({
                className: TOGGLER_BUTTON_CLASS,
                title: __('accounts.select'),
                onClick: (e) => this.onToggleAccount(e),
            });
            this.accountToggler = createElement('div', {
                props: { className: TOGGLER_CLASS },
                children: this.togglerButton.elem,
            });
            children.push(this.accountToggler);
        }

        if (this.props.noDataMessage) {
            this.noDataMessage = createElement('span', {
                props: {
                    className: NO_DATA_MSG_CLASS,
                    textContent: this.props.noDataMessage,
                },
            });
            children.push(this.noDataMessage);
        }

        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children,
        });

        this.setClassNames();
        this.setUserProps();
        this.render(this.state);
    }

    onClose(e) {
        if (isFunction(this.props.onClose)) {
            this.props.onClose(e);
        }
    }

    onToggleAccount(e) {
        if (isFunction(this.props.onToggleAccount)) {
            this.props.onToggleAccount(e);
        }
    }

    setTitle(title) {
        this.setState({ ...this.state, title });
    }

    render(state) {
        if (!state) {
            throw new Error('invalid state');
        }

        this.titleTextElem.textContent = state.title;
    }
}
