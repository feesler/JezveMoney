import { Collapsible } from 'jezvejs/Collapsible';

import { ListItem } from '../ListItem/ListItem.js';
import { ToggleButton } from '../../Common/ToggleButton/ToggleButton.js';

const defaultProps = {
    collapsed: true,
    content: null,
    toggleButton: false,
    toggleOnClick: false,
    animated: false,
};

/**
 * List item inside Collapsible component
 */
export class CollapsibleListItem extends ListItem {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        super.init();

        this.collapsible = Collapsible.create({
            content: this.props.content,
            collapsed: this.props.collapsed,
            toggleOnClick: this.props.toggleOnClick,
            animated: this.props.animated,
            header: this.contentElem,
        });
        this.elem = this.collapsible.elem;
    }

    setCollapsibleContent(content) {
        this.collapsible.setContent(content);
    }

    collapse(value = true) {
        this.setState({ ...this.state, collapsed: !!value });
    }

    expand(value = true) {
        this.setState({ ...this.state, collapsed: !value });
    }

    toggle() {
        this.setState({ ...this.state, collapsed: !this.state.collapsed });
    }

    onToggle() {
    }

    createToggleButton() {
        if (this.toggleButton) {
            return;
        }

        this.toggleButton = ToggleButton.create({
            onClick: (e) => this.onToggle(e),
        });
        this.controlsElem.append(this.toggleButton.elem);
    }

    renderToggleButton(state, prevState) {
        const { toggleButton, showControls } = state;
        if (
            toggleButton === prevState?.toggleButton
            && showControls === prevState?.showControls
        ) {
            return;
        }

        if (toggleButton && showControls) {
            this.createToggleButton();
        } else if (this.toggleButton) {
            this.toggleButton.elem.remove();
            this.toggleButton = null;
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.renderToggleButton(state, prevState);

        if (state.collapsed) {
            this.collapsible.collapse();
        } else {
            this.collapsible.expand();
        }
    }
}
