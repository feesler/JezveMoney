import { Component } from 'jezvejs';
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

            const title = (entry.isIntersecting) ? null : this.state.title;
            window.app.view.header.setTitle(title);

            if (!this.actionsContainer) {
                return;
            }

            if (entry.isIntersecting) {
                window.app.view.header.showUserMenu();
                this.elem.append(this.actionsContainer);
            } else {
                window.app.view.header.showActions(this.actionsContainer);
            }
        }, options);

        observer.observe(this.elem);
    }
}
