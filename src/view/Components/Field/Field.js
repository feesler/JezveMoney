import {
    ce,
    addChilds,
    removeChilds,
    Component,
} from 'jezvejs';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'field';
const TITLE_CLASS = 'field__title';
const CONTENT_CLASS = 'field__content';

/**
 * Field component
 */
export class Field extends Component {
    static create(props) {
        return new Field(props);
    }

    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.titleElem = ce('label', { className: TITLE_CLASS });
        this.contentContainer = ce('div', { className: CONTENT_CLASS });
        this.elem = ce(
            'div',
            { className: CONTAINER_CLASS },
            [this.titleElem, this.contentContainer],
        );

        this.setClassNames();
        this.render();
    }

    setTitle(title) {
        removeChilds(this.titleElem);

        if (!title) {
            return;
        }

        if (typeof title === 'string') {
            this.titleElem.textContent = title;
        } else {
            addChilds(this.titleElem, title);
        }
    }

    setContent(content) {
        removeChilds(this.contentContainer);

        if (!content) {
            return;
        }

        if (typeof content === 'string') {
            this.contentContainer.textContent = content;
        } else {
            addChilds(this.contentContainer, content);
        }
    }

    render() {
        this.setTitle(this.props.title);
        this.setContent(this.props.content);
    }
}
