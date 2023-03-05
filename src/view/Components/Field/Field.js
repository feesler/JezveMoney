import {
    createElement,
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
    static userProps = {
        elem: ['id'],
    };

    constructor(...args) {
        super(...args);

        this.init();
    }

    init() {
        this.titleElem = createElement('label', { props: { className: TITLE_CLASS } });
        this.contentContainer = createElement('div', { props: { className: CONTENT_CLASS } });
        this.elem = createElement('div', {
            props: { className: CONTAINER_CLASS },
            children: [this.titleElem, this.contentContainer],
        });

        this.setClassNames();
        this.setUserProps();
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
