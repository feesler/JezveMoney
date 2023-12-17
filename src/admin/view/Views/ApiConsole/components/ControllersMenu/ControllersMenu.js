import { Component } from 'jezvejs';
import { createElement, getClassName } from '@jezvejs/dom';

import './ControllersMenu.scss';

/* CSS classes */
const MENU_CLASS = 'api-menu';
const MENU_ITEM_CLASS = 'menu-item';
const SUB_MENU_CLASS = 'sub-menu-list';
const SUB_MENU_ITEM_CLASS = 'sub-menu-item';
const ACTIVE_ITEM_CLASS = 'active';

const defaultProps = {
    items: null,
    activeController: null,
    activeMethod: null,
    onMethodSelect: null,
};

/**
 * API controllers menu component
 */
export class ControllersMenu extends Component {
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
        this.postInit();
        this.render(this.state);
    }

    init() {
        this.elem = createElement('ul', {
            props: { className: MENU_CLASS },
            events: { click: (e) => this.onClick(e) },
        });
    }

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }

    onClick(e) {
        const targetEl = e.target;

        this.activateMenu(targetEl);

        const formId = targetEl?.dataset?.target;
        if (formId) {
            this.props.onMethodSelect?.(formId);
        }
    }

    /**
     * Activate specified menu item, expand sub menu if available
     * and collapse submenus of other items
     * @param {Element} menuElem - menu item element to activate
     */
    activateMenu(menuElem) {
        const subItemEl = menuElem.closest(`.${SUB_MENU_ITEM_CLASS}`);
        const formId = subItemEl?.dataset?.target;
        if (formId) {
            this.acivateMethod(formId);
            return;
        }

        const mainItemEl = menuElem.closest(`.${MENU_ITEM_CLASS}`);
        const controller = mainItemEl?.dataset?.id;
        this.acivateController(controller);
    }

    acivateController(activeController) {
        if (!activeController) {
            return;
        }

        this.setState({
            ...this.state,
            activeController,
            items: this.state.items.map((item) => ({
                ...item,
                active: (item.name === activeController),
            })),
        });
    }

    acivateMethod(activeMethod) {
        this.setState({
            ...this.state,
            activeMethod,
        });
    }

    renderMethodItem(method, state) {
        const active = method.formId === state.activeMethod;

        return createElement('li', {
            props: {
                className: getClassName(SUB_MENU_ITEM_CLASS, (active && ACTIVE_ITEM_CLASS)),
                dataset: { target: method.formId },
                textContent: method.title,
            },
        });
    }

    renderMethodsList(item, state) {
        return createElement('ul', {
            props: { className: SUB_MENU_CLASS },
            children: item.methods.map((method) => this.renderMethodItem(method, state)),
        });
    }

    renderControllerItem(item, state) {
        const active = item.name === state.activeController;

        const titleBtn = createElement('button', { props: { textContent: item.title } });

        return createElement('li', {
            props: {
                className: getClassName(MENU_ITEM_CLASS, (active && ACTIVE_ITEM_CLASS)),
                dataset: { id: item.name },
            },
            children: [
                titleBtn,
                this.renderMethodsList(item, state),
            ],
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const elems = state.items.map((item) => this.renderControllerItem(item, state));
        this.elem.replaceChildren(...elems);
    }
}
