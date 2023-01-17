import { Component, px } from 'jezvejs';
import './style.scss';

const defaultProps = {
    title: null,
};

export class Heading extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        if (this.elem) {
            this.parse();
        }
    }

    parse() {
        if (!this.elem) {
            throw new Error('Invalid element specified');
        }

        this.titleElem = this.elem.querySelector('h1');
        this.actionsContainer = this.elem.querySelector('.heading-actions');

        this.postInit();
    }

    postInit() {
        this.createObserver();
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '-50px',
            threshold: 0,
        };
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.target !== this.elem) {
                return;
            }

            const headerTitle = (entry.isIntersecting) ? null : this.state.title;
            window.app.view.header.setTitle(headerTitle);

            if (!this.actionsContainer) {
                return;
            }

            if (entry.isIntersecting) {
                window.app.view.header.showUserMenu(() => {
                    this.titleElem.textContent = this.state.title;
                    this.elem.append(this.actionsContainer);
                    this.elem.style.height = '';
                });
            } else {
                this.elem.style.height = px(this.elem.offsetHeight);
                window.app.view.header.showActions(this.actionsContainer);
                this.titleElem.textContent = null;
            }
        }, options);

        observer.observe(this.elem);
    }
}
