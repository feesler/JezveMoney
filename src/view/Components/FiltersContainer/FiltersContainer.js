import {
    isVisible,
    debounce,
    Component,
} from 'jezvejs';
import { CloseButton } from 'jezvejs/CloseButton';
import { Collapsible } from 'jezvejs/Collapsible';
import { Offcanvas } from 'jezvejs/Offcanvas';
import './FiltersContainer.scss';

const RESIZE_DELAY = 200;

export class FiltersContainer extends Component {
    constructor(props) {
        super(props);

        this.init();
    }

    init() {
        if (!this.props.content) {
            throw new Error('Invalid content');
        }
        this.content = this.props.content;

        this.offcanvas = Offcanvas.create({
            placement: 'right',
            className: 'filters-offcanvas',
        });

        this.collapsible = Collapsible.create({
            header: null,
            content: this.content,
            className: 'filters-collapsible',
        });

        this.heading = this.content.querySelector('.filters-heading');

        this.closeBtn = CloseButton.create({
            id: 'closeFiltersBtn',
            small: false,
            className: 'circle-btn',
            onClick: () => this.closeOffcanvas(),
        });
        this.heading.append(this.closeBtn.elem);

        this.elem = this.collapsible.elem;

        this.observeSize();
    }

    isDesktop() {
        return isVisible(this.collapsible.elem);
    }

    /**
     * Listen to document resize events to move filters container element
     * between Collapsible and Offcanvas
     */
    observeSize() {
        const handler = debounce(() => {
            if (
                this.isDesktop()
                && this.offcanvas.elem.contains(this.content)
            ) {
                this.closeOffcanvas();
            }
        }, RESIZE_DELAY);

        const observer = new ResizeObserver(handler);
        observer.observe(document.documentElement);
    }

    /** Shows filters Offcanvas */
    openOffcanvas() {
        this.offcanvas.setContent(this.content);
        this.offcanvas.open();
    }

    /** Hides filters Offcanvas */
    closeOffcanvas() {
        this.offcanvas.close();
        this.collapsible.setContent(this.content);
    }

    /** Toggle show/hide filters */
    toggle() {
        if (this.isDesktop()) {
            this.collapsible.toggle();
        } else {
            this.openOffcanvas();
        }
    }

    close() {
        if (this.isDesktop()) {
            this.collapsible.collapse();
        } else {
            this.closeOffcanvas();
        }
    }
}
