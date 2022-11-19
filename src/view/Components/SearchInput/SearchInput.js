import {
    createElement,
    re,
    isFunction,
    Component,
} from 'jezvejs';
import { InputGroup } from 'jezvejs/InputGroup';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'search-field';
const INPUT_CLASS = 'input-group__input stretch-input';
const INNER_BTN_CLASS = 'input-group__inner-btn';
const INNER_BTN_ICON_CLASS = 'input-group__inner-btn__icon';
const CLEAR_BTN_CLASS = 'clear-btn';
const SEARCH_BTN_CLASS = 'search-btn';
const SEARCH_ICON_CLASS = 'icon search-icon';

const defaultProps = {
    id: undefined,
    name: undefined,
    form: undefined,
    placeholder: undefined,
    value: '',
    onChange: null,
};

/**
 * Search input component
 */
export class SearchInput extends Component {
    static userProps = {
        elem: ['id'],
        input: ['id', 'name', 'form', 'placeholder'],
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

    get value() {
        return this.state.value;
    }

    set value(val) {
        this.setState({ ...this.state, value: val });
    }

    init() {
        this.input = createElement('input', {
            props: {
                className: INPUT_CLASS,
                type: 'text',
                autocomplete: 'off',
                inputMode: 'search',
            },
            events: { input: (e) => this.onInput(e) },
        });

        const clearIcon = window.app.createIcon('close', INNER_BTN_ICON_CLASS);
        this.clearBtn = createElement('button', {
            props: {
                className: [INNER_BTN_CLASS, CLEAR_BTN_CLASS].join(' '),
                type: 'button',
            },
            children: clearIcon,
            events: { click: (e) => this.onClear(e) },
        });

        const searchIcon = window.app.createIcon('search', SEARCH_ICON_CLASS);
        this.searchBtn = createElement('button', {
            props: {
                className: [INNER_BTN_CLASS, SEARCH_BTN_CLASS].join(' '),
                type: 'button',
                tabIndex: -1,
            },
            children: searchIcon,
        });

        this.inputGroup = InputGroup.create({
            className: CONTAINER_CLASS,
            children: [
                this.searchBtn,
                this.input,
            ],
        });
        this.elem = this.inputGroup.elem;

        this.setUserProps();

        this.setClassNames();
        this.render(this.state);
    }

    onInput() {
        this.setState({ ...this.state, value: this.input.value });
        this.sendChangeEvent();
    }

    onClear() {
        this.setState({ ...this.state, value: '' });
        this.sendChangeEvent();
    }

    sendChangeEvent() {
        if (!isFunction(this.props.onChange)) {
            return;
        }

        this.props.onChange(this.state.value);
    }

    render(state) {
        const value = state.value ?? '';
        this.input.value = value;

        if (value.length > 0) {
            this.elem.append(this.clearBtn);
        } else {
            re(this.clearBtn);
        }
    }
}
