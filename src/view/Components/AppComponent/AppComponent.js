import {
    ce,
    svg,
    isVisible,
    Component,
} from 'jezvejs';

/**
 * Base app component
 * @param {Object} props
 * @param {string|Element} props.elem - base element for component
 */
export class AppComponent extends Component {
    /** Check root element of component is visible */
    isVisible() {
        return isVisible(this.elem, true);
    }

    /** Create simple container element */
    createContainer(elemClass, children, events) {
        return ce('div', { className: elemClass }, children, events);
    }

    /** Create SVG icon element */
    createIcon(icon) {
        const useElem = svg('use');
        const res = svg('svg', {}, useElem);

        useElem.href.baseVal = (icon) ? `#${icon}` : '';

        return res;
    }

    /**
     * Create checkbox container from given input element
     * @param {Element} input - checkbox input element
     * @param {string} elemClass - class for checkbox container element
     * @param {string} title - optional title
     */
    createCheck(input, elemClass, title) {
        if (!input) {
            throw new Error('Invalid input element');
        }

        const childs = [input];
        if (typeof title === 'string') {
            childs.push(ce('span', { textContent: title }));
        }

        return ce('label', { className: elemClass }, childs);
    }

    /** Create field element from given input element */
    createField(title, input, extraClass) {
        const elemClasses = ['field'];

        if (typeof extraClass === 'string' && extraClass.length > 0) {
            elemClasses.push(extraClass);
        }

        return ce('div', { className: elemClasses.join(' ') }, [
            ce('label', { textContent: title }),
            ce('div', {}, input),
        ]);
    }
}
