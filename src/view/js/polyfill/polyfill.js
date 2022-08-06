/* Polyfill service v3.111.0
 * For detailed credits and licence information see https://github.com/financial-times/polyfill-service.
 * 
 * Features requested: CustomEvent,DOMTokenList,DOMTokenList.prototype.@@iterator,DOMTokenList.prototype.forEach,DOMTokenList.prototype.replace,Document,DocumentFragment,DocumentFragment.prototype.append,DocumentFragment.prototype.prepend,Element,Element.prototype.after,Element.prototype.animate,Element.prototype.append,Element.prototype.before,Element.prototype.classList,Element.prototype.cloneNode,Element.prototype.closest,Element.prototype.dataset,Element.prototype.getAttributeNames,Element.prototype.inert,Element.prototype.matches,Element.prototype.nextElementSibling,Element.prototype.placeholder,Element.prototype.prepend,Element.prototype.previousElementSibling,Element.prototype.remove,Element.prototype.replaceWith,Element.prototype.scroll,Element.prototype.scrollBy,Element.prototype.scrollIntoView,Element.prototype.toggleAttribute,HTMLDocument,Node.prototype.contains,Node.prototype.isSameNode,NodeList.prototype.@@iterator,NodeList.prototype.forEach
 * 
 * - Element.prototype.inert, License: W3C
 * - smoothscroll, License: MIT (required by "Element.prototype.scrollIntoView") */

(function(self, undefined) {

// Element.prototype.inert
/* global Set, Map */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	// eslint-disable-next-line no-undef
	typeof define === 'function' && define.amd ? define('inert', factory) :
	(factory());
}(this, (function () { 'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	* This work is licensed under the W3C Software and Document License
	* (http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).
	*/

	// Convenience function for converting NodeLists.
	/** @type {typeof Array.prototype.slice} */
	var slice = Array.prototype.slice;

	/**
	* IE has a non-standard name for "matches".
	* @type {typeof Element.prototype.matches}
	*/
	var matches = Element.prototype.matches || Element.prototype.msMatchesSelector;

	/** @type {string} */
	var _focusableElementsString = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'details', 'summary', 'iframe', 'object', 'embed', '[contenteditable]'].join(',');

	/**
	* `InertRoot` manages a single inert subtree, i.e. a DOM subtree whose root element has an `inert`
	* attribute.
	*
	* Its main functions are:
	*
	* - to create and maintain a set of managed `InertNode`s, including when mutations occur in the
	*   subtree. The `makeSubtreeUnfocusable()` method handles collecting `InertNode`s via registering
	*   each focusable node in the subtree with the singleton `InertManager` which manages all known
	*   focusable nodes within inert subtrees. `InertManager` ensures that a single `InertNode`
	*   instance exists for each focusable node which has at least one inert root as an ancestor.
	*
	* - to notify all managed `InertNode`s when this subtree stops being inert (i.e. when the `inert`
	*   attribute is removed from the root node). This is handled in the destructor, which calls the
	*   `deregister` method on `InertManager` for each managed inert node.
	*/

	var InertRoot = function () {
		/**
		* @param {!Element} rootElement The Element at the root of the inert subtree.
		* @param {!InertManager} inertManager The global singleton InertManager object.
		*/
		function InertRoot(rootElement, inertManager) {
			_classCallCheck(this, InertRoot);

			/** @type {!InertManager} */
			this._inertManager = inertManager;

			/** @type {!Element} */
			this._rootElement = rootElement;

			/**
			* @type {!Set<!InertNode>}
			* All managed focusable nodes in this InertRoot's subtree.
			*/
			this._managedNodes = new Set();

			// Make the subtree hidden from assistive technology
			if (this._rootElement.hasAttribute('aria-hidden')) {
				/** @type {?string} */
				this._savedAriaHidden = this._rootElement.getAttribute('aria-hidden');
			} else {
				this._savedAriaHidden = null;
			}
			this._rootElement.setAttribute('aria-hidden', 'true');

			// Make all focusable elements in the subtree unfocusable and add them to _managedNodes
			this._makeSubtreeUnfocusable(this._rootElement);

			// Watch for:
			// - any additions in the subtree: make them unfocusable too
			// - any removals from the subtree: remove them from this inert root's managed nodes
			// - attribute changes: if `tabindex` is added, or removed from an intrinsically focusable
			//   element, make that node a managed node.
			this._observer = new MutationObserver(this._onMutation.bind(this));
			this._observer.observe(this._rootElement, { attributes: true, childList: true, subtree: true });
		}

		/**
		* Call this whenever this object is about to become obsolete.  This unwinds all of the state
		* stored in this object and updates the state of all of the managed nodes.
		*/


		_createClass(InertRoot, [{
			key: 'destructor',
			value: function destructor() {
				this._observer.disconnect();

				if (this._rootElement) {
					if (this._savedAriaHidden !== null) {
						this._rootElement.setAttribute('aria-hidden', this._savedAriaHidden);
					} else {
						this._rootElement.removeAttribute('aria-hidden');
					}
				}

				this._managedNodes.forEach(function (inertNode) {
					this._unmanageNode(inertNode.node);
				}, this);

				// Note we cast the nulls to the ANY type here because:
				// 1) We want the class properties to be declared as non-null, or else we
				//    need even more casts throughout this code. All bets are off if an
				//    instance has been destroyed and a method is called.
				// 2) We don't want to cast "this", because we want type-aware optimizations
				//    to know which properties we're setting.
				this._observer = /** @type {?} */null;
				this._rootElement = /** @type {?} */null;
				this._managedNodes = /** @type {?} */null;
				this._inertManager = /** @type {?} */null;
			}

			/**
			* @return {!Set<!InertNode>} A copy of this InertRoot's managed nodes set.
			*/

		}, {
			key: '_makeSubtreeUnfocusable',


			/**
			* @param {!Node} startNode
			*/
			value: function _makeSubtreeUnfocusable(startNode) {
				var _this2 = this;

				composedTreeWalk(startNode, function (node) {
					return _this2._visitNode(node);
				});

				var activeElement = document.activeElement;

				if (!document.body.contains(startNode)) {
					// startNode may be in shadow DOM, so find its nearest shadowRoot to get the activeElement.
					var node = startNode;
					/** @type {!ShadowRoot|undefined} */
					var root = undefined;
					while (node) {
						if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
							root = /** @type {!ShadowRoot} */node;
							break;
						}
						node = node.parentNode;
					}
					if (root) {
						activeElement = root.activeElement;
					}
				}
				if (startNode.contains(activeElement)) {
					activeElement.blur();
					// In IE11, if an element is already focused, and then set to tabindex=-1
					// calling blur() will not actually move the focus.
					// To work around this we call focus() on the body instead.
					if (activeElement === document.activeElement) {
						document.body.focus();
					}
				}
			}

			/**
			* @param {!Node} node
			*/

		}, {
			key: '_visitNode',
			value: function _visitNode(node) {
				if (node.nodeType !== Node.ELEMENT_NODE) {
					return;
				}
				var element = /** @type {!Element} */node;

				// If a descendant inert root becomes un-inert, its descendants will still be inert because of
				// this inert root, so all of its managed nodes need to be adopted by this InertRoot.
				if (element !== this._rootElement && element.hasAttribute('inert')) {
					this._adoptInertRoot(element);
				}

				if (matches.call(element, _focusableElementsString) || element.hasAttribute('tabindex')) {
					this._manageNode(element);
				}
			}

			/**
			* Register the given node with this InertRoot and with InertManager.
			* @param {!Node} node
			*/

		}, {
			key: '_manageNode',
			value: function _manageNode(node) {
				var inertNode = this._inertManager.register(node, this);
				this._managedNodes.add(inertNode);
			}

			/**
			* Unregister the given node with this InertRoot and with InertManager.
			* @param {!Node} node
			*/

		}, {
			key: '_unmanageNode',
			value: function _unmanageNode(node) {
				var inertNode = this._inertManager.deregister(node, this);
				if (inertNode) {
					this._managedNodes['delete'](inertNode);
				}
			}

			/**
			* Unregister the entire subtree starting at `startNode`.
			* @param {!Node} startNode
			*/

		}, {
			key: '_unmanageSubtree',
			value: function _unmanageSubtree(startNode) {
				var _this3 = this;

				composedTreeWalk(startNode, function (node) {
					return _this3._unmanageNode(node);
				});
			}

			/**
			* If a descendant node is found with an `inert` attribute, adopt its managed nodes.
			* @param {!Element} node
			*/

		}, {
			key: '_adoptInertRoot',
			value: function _adoptInertRoot(node) {
				var inertSubroot = this._inertManager.getInertRoot(node);

				// During initialisation this inert root may not have been registered yet,
				// so register it now if need be.
				if (!inertSubroot) {
					this._inertManager.setInert(node, true);
					inertSubroot = this._inertManager.getInertRoot(node);
				}

				inertSubroot.managedNodes.forEach(function (savedInertNode) {
					this._manageNode(savedInertNode.node);
				}, this);
			}

			/**
			* Callback used when mutation observer detects subtree additions, removals, or attribute changes.
			* @param {!Array<!MutationRecord>} records
			* @param {!MutationObserver} self
			*/

		}, {
			key: '_onMutation',
			value: function _onMutation(records, _self) {
				records.forEach(function (record) {
					var target = /** @type {!Element} */record.target;
					if (record.type === 'childList') {
						// Manage added nodes
						slice.call(record.addedNodes).forEach(function (node) {
							this._makeSubtreeUnfocusable(node);
						}, this);

						// Un-manage removed nodes
						slice.call(record.removedNodes).forEach(function (node) {
							this._unmanageSubtree(node);
						}, this);
					} else if (record.type === 'attributes') {
						if (record.attributeName === 'tabindex') {
							// Re-initialise inert node if tabindex changes
							this._manageNode(target);
						} else if (target !== this._rootElement && record.attributeName === 'inert' && target.hasAttribute('inert')) {
							// If a new inert root is added, adopt its managed nodes and make sure it knows about the
							// already managed nodes from this inert subroot.
							this._adoptInertRoot(target);
							var inertSubroot = this._inertManager.getInertRoot(target);
							this._managedNodes.forEach(function (managedNode) {
								if (target.contains(managedNode.node)) {
									inertSubroot._manageNode(managedNode.node);
								}
							});
						}
					}
				}, this);
			}
		}, {
			key: 'managedNodes',
			get: function get() {
				return new Set(this._managedNodes);
			}

			/** @return {boolean} */

		}, {
			key: 'hasSavedAriaHidden',
			get: function get() {
				return this._savedAriaHidden !== null;
			}

			/** @param {?string} ariaHidden */

		}, {
			key: 'savedAriaHidden',
			set: function set(ariaHidden) {
				this._savedAriaHidden = ariaHidden;
			}

			/** @return {?string} */
			,
			get: function get() {
				return this._savedAriaHidden;
			}
		}]);

		return InertRoot;
	}();

	/**
	* `InertNode` initialises and manages a single inert node.
	* A node is inert if it is a descendant of one or more inert root elements.
	*
	* On construction, `InertNode` saves the existing `tabindex` value for the node, if any, and
	* either removes the `tabindex` attribute or sets it to `-1`, depending on whether the element
	* is intrinsically focusable or not.
	*
	* `InertNode` maintains a set of `InertRoot`s which are descendants of this `InertNode`. When an
	* `InertRoot` is destroyed, and calls `InertManager.deregister()`, the `InertManager` notifies the
	* `InertNode` via `removeInertRoot()`, which in turn destroys the `InertNode` if no `InertRoot`s
	* remain in the set. On destruction, `InertNode` reinstates the stored `tabindex` if one exists,
	* or removes the `tabindex` attribute if the element is intrinsically focusable.
	*/


	var InertNode = function () {
		/**
		* @param {!Node} node A focusable element to be made inert.
		* @param {!InertRoot} inertRoot The inert root element associated with this inert node.
		*/
		function InertNode(node, inertRoot) {
			_classCallCheck(this, InertNode);

			/** @type {!Node} */
			this._node = node;

			/** @type {boolean} */
			this._overrodeFocusMethod = false;

			/**
			* @type {!Set<!InertRoot>} The set of descendant inert roots.
			*    If and only if this set becomes empty, this node is no longer inert.
			*/
			this._inertRoots = new Set([inertRoot]);

			/** @type {?number} */
			this._savedTabIndex = null;

			/** @type {boolean} */
			this._destroyed = false;

			// Save any prior tabindex info and make this node untabbable
			this.ensureUntabbable();
		}

		/**
		* Call this whenever this object is about to become obsolete.
		* This makes the managed node focusable again and deletes all of the previously stored state.
		*/


		_createClass(InertNode, [{
			key: 'destructor',
			value: function destructor() {
				this._throwIfDestroyed();

				if (this._node && this._node.nodeType === Node.ELEMENT_NODE) {
					var element = /** @type {!Element} */this._node;
					if (this._savedTabIndex !== null) {
						element.setAttribute('tabindex', this._savedTabIndex);
					} else {
						element.removeAttribute('tabindex');
					}

					// Use `delete` to restore native focus method.
					if (this._overrodeFocusMethod) {
						delete element.focus;
					}
				}

				// See note in InertRoot.destructor for why we cast these nulls to ANY.
				this._node = /** @type {?} */null;
				this._inertRoots = /** @type {?} */null;
				this._destroyed = true;
			}

			/**
			* @type {boolean} Whether this object is obsolete because the managed node is no longer inert.
			* If the object has been destroyed, any attempt to access it will cause an exception.
			*/

		}, {
			key: '_throwIfDestroyed',


			/**
			* Throw if user tries to access destroyed InertNode.
			*/
			value: function _throwIfDestroyed() {
				if (this.destroyed) {
					throw new Error('Trying to access destroyed InertNode');
				}
			}

			/** @return {boolean} */

		}, {
			key: 'ensureUntabbable',


			/** Save the existing tabindex value and make the node untabbable and unfocusable */
			value: function ensureUntabbable() {
				if (this.node.nodeType !== Node.ELEMENT_NODE) {
					return;
				}
				var element = /** @type {!Element} */this.node;
				if (matches.call(element, _focusableElementsString)) {
					if ( /** @type {!HTMLElement} */element.tabIndex === -1 && this.hasSavedTabIndex) {
						return;
					}

					if (element.hasAttribute('tabindex')) {
						this._savedTabIndex = /** @type {!HTMLElement} */element.tabIndex;
					}
					element.setAttribute('tabindex', '-1');
					if (element.nodeType === Node.ELEMENT_NODE) {
						element.focus = function () {};
						this._overrodeFocusMethod = true;
					}
				} else if (element.hasAttribute('tabindex')) {
					this._savedTabIndex = /** @type {!HTMLElement} */element.tabIndex;
					element.removeAttribute('tabindex');
				}
			}

			/**
			* Add another inert root to this inert node's set of managing inert roots.
			* @param {!InertRoot} inertRoot
			*/

		}, {
			key: 'addInertRoot',
			value: function addInertRoot(inertRoot) {
				this._throwIfDestroyed();
				this._inertRoots.add(inertRoot);
			}

			/**
			* Remove the given inert root from this inert node's set of managing inert roots.
			* If the set of managing inert roots becomes empty, this node is no longer inert,
			* so the object should be destroyed.
			* @param {!InertRoot} inertRoot
			*/

		}, {
			key: 'removeInertRoot',
			value: function removeInertRoot(inertRoot) {
				this._throwIfDestroyed();
				this._inertRoots['delete'](inertRoot);
				if (this._inertRoots.size === 0) {
					this.destructor();
				}
			}
		}, {
			key: 'destroyed',
			get: function get() {
				return (/** @type {!InertNode} */this._destroyed
				);
			}
		}, {
			key: 'hasSavedTabIndex',
			get: function get() {
				return this._savedTabIndex !== null;
			}

			/** @return {!Node} */

		}, {
			key: 'node',
			get: function get() {
				this._throwIfDestroyed();
				return this._node;
			}

			/** @param {?number} tabIndex */

		}, {
			key: 'savedTabIndex',
			set: function set(tabIndex) {
				this._throwIfDestroyed();
				this._savedTabIndex = tabIndex;
			}

			/** @return {?number} */
			,
			get: function get() {
				this._throwIfDestroyed();
				return this._savedTabIndex;
			}
		}]);

		return InertNode;
	}();

	/**
	* InertManager is a per-document singleton object which manages all inert roots and nodes.
	*
	* When an element becomes an inert root by having an `inert` attribute set and/or its `inert`
	* property set to `true`, the `setInert` method creates an `InertRoot` object for the element.
	* The `InertRoot` in turn registers itself as managing all of the element's focusable descendant
	* nodes via the `register()` method. The `InertManager` ensures that a single `InertNode` instance
	* is created for each such node, via the `_managedNodes` map.
	*/


	var InertManager = function () {
		/**
		* @param {!Document} document
		*/
		function InertManager(document) {
			_classCallCheck(this, InertManager);

			if (!document) {
				throw new Error('Missing required argument; InertManager needs to wrap a document.');
			}

			/** @type {!Document} */
			this._document = document;

			/**
			* All managed nodes known to this InertManager. In a map to allow looking up by Node.
			* @type {!Map<!Node, !InertNode>}
			*/
			this._managedNodes = new Map();

			/**
			* All inert roots known to this InertManager. In a map to allow looking up by Node.
			* @type {!Map<!Node, !InertRoot>}
			*/
			this._inertRoots = new Map();

			/**
			* Observer for mutations on `document.body`.
			* @type {!MutationObserver}
			*/
			this._observer = new MutationObserver(this._watchForInert.bind(this));

			// Add inert style.
			addInertStyle(document.head || document.body || document.documentElement);

			// Wait for document to be loaded.
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', this._onDocumentLoaded.bind(this));
			} else {
				this._onDocumentLoaded();
			}
		}

		/**
		* Set whether the given element should be an inert root or not.
		* @param {!Element} root
		* @param {boolean} inert
		*/


		_createClass(InertManager, [{
			key: 'setInert',
			value: function setInert(root, inert) {
				if (inert) {
					if (this._inertRoots.has(root)) {
						// element is already inert
						return;
					}

					var inertRoot = new InertRoot(root, this);
					root.setAttribute('inert', '');
					this._inertRoots.set(root, inertRoot);
					// If not contained in the document, it must be in a shadowRoot.
					// Ensure inert styles are added there.
					if (!this._document.body.contains(root)) {
						var parent = root.parentNode;
						while (parent) {
							if (parent.nodeType === 11) {
								addInertStyle(parent);
							}
							parent = parent.parentNode;
						}
					}
				} else {
					if (!this._inertRoots.has(root)) {
						// element is already non-inert
						return;
					}

					var _inertRoot = this._inertRoots.get(root);
					_inertRoot.destructor();
					this._inertRoots['delete'](root);
					root.removeAttribute('inert');
				}
			}

			/**
			* Get the InertRoot object corresponding to the given inert root element, if any.
			* @param {!Node} element
			* @return {!InertRoot|undefined}
			*/

		}, {
			key: 'getInertRoot',
			value: function getInertRoot(element) {
				return this._inertRoots.get(element);
			}

			/**
			* Register the given InertRoot as managing the given node.
			* In the case where the node has a previously existing inert root, this inert root will
			* be added to its set of inert roots.
			* @param {!Node} node
			* @param {!InertRoot} inertRoot
			* @return {!InertNode} inertNode
			*/

		}, {
			key: 'register',
			value: function register(node, inertRoot) {
				var inertNode = this._managedNodes.get(node);
				if (inertNode !== undefined) {
					// node was already in an inert subtree
					inertNode.addInertRoot(inertRoot);
				} else {
					inertNode = new InertNode(node, inertRoot);
				}

				this._managedNodes.set(node, inertNode);

				return inertNode;
			}

			/**
			* De-register the given InertRoot as managing the given inert node.
			* Removes the inert root from the InertNode's set of managing inert roots, and remove the inert
			* node from the InertManager's set of managed nodes if it is destroyed.
			* If the node is not currently managed, this is essentially a no-op.
			* @param {!Node} node
			* @param {!InertRoot} inertRoot
			* @return {?InertNode} The potentially destroyed InertNode associated with this node, if any.
			*/

		}, {
			key: 'deregister',
			value: function deregister(node, inertRoot) {
				var inertNode = this._managedNodes.get(node);
				if (!inertNode) {
					return null;
				}

				inertNode.removeInertRoot(inertRoot);
				if (inertNode.destroyed) {
					this._managedNodes['delete'](node);
				}

				return inertNode;
			}

			/**
			* Callback used when document has finished loading.
			*/

		}, {
			key: '_onDocumentLoaded',
			value: function _onDocumentLoaded() {
				// Find all inert roots in document and make them actually inert.
				var inertElements = slice.call(this._document.querySelectorAll('[inert]'));
				inertElements.forEach(function (inertElement) {
					this.setInert(inertElement, true);
				}, this);

				// Comment this out to use programmatic API only.
				this._observer.observe(this._document.body || this._document.documentElement, {attributes: true, subtree: true, childList: true});
			}

			/**
			* Callback used when mutation observer detects attribute changes.
			* @param {!Array<!MutationRecord>} records
			* @param {!MutationObserver} self
			*/

		}, {
			key: '_watchForInert',
			value: function _watchForInert(records, _self) {
				var _this = this;
				records.forEach(function (record) {
					switch (record.type) {
						case 'childList':
							slice.call(record.addedNodes).forEach(function (node) {
								if (node.nodeType !== Node.ELEMENT_NODE) {
									return;
								}
								var inertElements = slice.call(node.querySelectorAll('[inert]'));
								if (matches.call(node, '[inert]')) {
									inertElements.unshift(node);
								}
								inertElements.forEach(function (inertElement) {
									this.setInert(inertElement, true);
								}, _this);
							}, _this);
							break;
						case 'attributes':
							if (record.attributeName !== 'inert') {
								return;
							}
							var target = /** @type {!Element} */record.target;
							var inert = target.hasAttribute('inert');
							_this.setInert(target, inert);
							break;
					}
				}, this);
			}
		}]);

		return InertManager;
	}();

	/**
	* Recursively walk the composed tree from |node|.
	* @param {!Node} node
	* @param {(function (!Element))=} callback Callback to be called for each element traversed,
	*     before descending into child nodes.
	* @param {?ShadowRoot=} shadowRootAncestor The nearest ShadowRoot ancestor, if any.
	*/


	function composedTreeWalk(node, callback, shadowRootAncestor) {
		if (node.nodeType == Node.ELEMENT_NODE) {
			var element = /** @type {!Element} */node;
			if (callback) {
				callback(element);
			}

			// Descend into node:
			// If it has a ShadowRoot, ignore all child elements - these will be picked
			// up by the <content> or <shadow> elements. Descend straight into the
			// ShadowRoot.
			var shadowRoot = /** @type {!HTMLElement} */element.shadowRoot;
			if (shadowRoot) {
				composedTreeWalk(shadowRoot, callback, shadowRoot);
				return;
			}

			// If it is a <content> element, descend into distributed elements - these
			// are elements from outside the shadow root which are rendered inside the
			// shadow DOM.
			if (element.localName == 'content') {
				var content = /** @type {!HTMLContentElement} */element;
				// Verifies if ShadowDom v0 is supported.
				var distributedNodes = content.getDistributedNodes ? content.getDistributedNodes() : [];
				for (var i = 0; i < distributedNodes.length; i++) {
					composedTreeWalk(distributedNodes[i], callback, shadowRootAncestor);
				}
				return;
			}

			// If it is a <slot> element, descend into assigned nodes - these
			// are elements from outside the shadow root which are rendered inside the
			// shadow DOM.
			if (element.localName == 'slot') {
				var slot = /** @type {!HTMLSlotElement} */element;
				// Verify if ShadowDom v1 is supported.
				var _distributedNodes = slot.assignedNodes ? slot.assignedNodes({ flatten: true }) : [];
				for (var _i = 0; _i < _distributedNodes.length; _i++) {
					composedTreeWalk(_distributedNodes[_i], callback, shadowRootAncestor);
				}
				return;
			}
		}

		// If it is neither the parent of a ShadowRoot, a <content> element, a <slot>
		// element, nor a <shadow> element recurse normally.
		var child = node.firstChild;
		while (child != null) {
			composedTreeWalk(child, callback, shadowRootAncestor);
			child = child.nextSibling;
		}
	}

	/**
	* Adds a style element to the node containing the inert specific styles
	* @param {!Node} node
	*/
	function addInertStyle(node) {
		if (node.querySelector('style#inert-style')) {
			return;
		}
		var style = document.createElement('style');
		style.setAttribute('id', 'inert-style');
		style.textContent = '\n' + '[inert] {\n' + '  pointer-events: none;\n' + '  cursor: default;\n' + '}\n' + '\n' + '[inert], [inert] * {\n' + '  user-select: none;\n' + '  -webkit-user-select: none;\n' + '  -moz-user-select: none;\n' + '  -ms-user-select: none;\n' + '}\n';
		node.appendChild(style);
	}

	/** @type {!InertManager} */
	var inertManager = new InertManager(document);

	// eslint-disable-next-line no-prototype-builtins
	if (!Element.prototype.hasOwnProperty('inert')) {
		Object.defineProperty(Element.prototype, 'inert', {
			enumerable: true,
			/** @this {!Element} */
			get: function get() {
				return this.hasAttribute('inert');
			},
			/** @this {!Element} */
			set: function set(inert) {
				inertManager.setInert(this, inert);
			}
		});
	}

})));

// smoothscroll
(function (global, factory) {
    var exports = {};
    factory(exports);
    exports.polyfill();
}(this, (function (exports) { 'use strict';

    var ease = function (k) {
        return 0.5 * (1 - Math.cos(Math.PI * k));
    };
    var DURATION = 500;
    var isScrollBehaviorSupported = function () { return "scrollBehavior" in document.documentElement.style; };
    var original = {
        _elementScroll: undefined,
        get elementScroll() {
            return (this._elementScroll || (this._elementScroll = HTMLElement.prototype.scroll ||
                HTMLElement.prototype.scrollTo ||
                function (x, y) {
                    this.scrollLeft = x;
                    this.scrollTop = y;
                }));
        },
        _elementScrollIntoView: undefined,
        get elementScrollIntoView() {
            return (this._elementScrollIntoView || (this._elementScrollIntoView = HTMLElement.prototype.scrollIntoView));
        },
        _windowScroll: undefined,
        get windowScroll() {
            return (this._windowScroll || (this._windowScroll = window.scroll || window.scrollTo));
        },
    };
    var modifyPrototypes = function (modification) {
        var prototypes = [HTMLElement.prototype, SVGElement.prototype, Element.prototype];
        prototypes.forEach(function (prototype) { return modification(prototype); });
    };
    var now = function () { var _a, _b, _c; return (_c = (_b = (_a = window.performance) === null || _a === void 0 ? void 0 : _a.now) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : Date.now(); };
    var step = function (context) {
        var currentTime = now();
        var elapsed = (currentTime - context.timeStamp) / (context.duration || DURATION);
        if (elapsed > 1) {
            context.method(context.targetX, context.targetY);
            context.callback();
            return;
        }
        var value = (context.timingFunc || ease)(elapsed);
        var currentX = context.startX + (context.targetX - context.startX) * value;
        var currentY = context.startY + (context.targetY - context.startY) * value;
        context.method(currentX, currentY);
        context.rafId = requestAnimationFrame(function () {
            step(context);
        });
    };
    // https://drafts.csswg.org/cssom-view/#normalize-non-finite-values
    var nonFinite = function (value) {
        if (!isFinite(value)) {
            return 0;
        }
        return Number(value);
    };
    var isObject = function (value) {
        var type = typeof value;
        return value !== null && (type === "object" || type === "function");
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    var elementScroll = function (element, options) {
        var _a, _b;
        var originalBoundFunc = original.elementScroll.bind(element);
        if (options.left === undefined && options.top === undefined) {
            return;
        }
        var startX = element.scrollLeft;
        var startY = element.scrollTop;
        var targetX = nonFinite((_a = options.left) !== null && _a !== void 0 ? _a : startX);
        var targetY = nonFinite((_b = options.top) !== null && _b !== void 0 ? _b : startY);
        if (options.behavior !== "smooth") {
            return originalBoundFunc(targetX, targetY);
        }
        var removeEventListener = function () {
            window.removeEventListener("wheel", cancelScroll);
            window.removeEventListener("touchmove", cancelScroll);
        };
        var context = {
            timeStamp: now(),
            duration: options.duration,
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            rafId: 0,
            method: originalBoundFunc,
            timingFunc: options.timingFunc,
            callback: removeEventListener,
        };
        var cancelScroll = function () {
            cancelAnimationFrame(context.rafId);
            removeEventListener();
        };
        window.addEventListener("wheel", cancelScroll, {
            passive: true,
            once: true,
        });
        window.addEventListener("touchmove", cancelScroll, {
            passive: true,
            once: true,
        });
        step(context);
    };
    var elementScrollPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        var originalFunc = original.elementScroll;
        modifyPrototypes(function (prototype) {
            return (prototype.scroll = function scroll() {
                if (arguments.length === 1) {
                    var scrollOptions = arguments[0];
                    if (!isObject(scrollOptions)) {
                        throw new TypeError("Failed to execute 'scroll' on 'Element': parameter 1 ('options') is not an object.");
                    }
                    return elementScroll(this, __assign(__assign({}, scrollOptions), animationOptions));
                }
                return originalFunc.apply(this, arguments);
            });
        });
    };

    var elementScrollBy = function (element, options) {
        var left = nonFinite(options.left || 0) + element.scrollLeft;
        var top = nonFinite(options.top || 0) + element.scrollTop;
        return elementScroll(element, __assign(__assign({}, options), { left: left, top: top }));
    };
    var elementScrollByPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        modifyPrototypes(function (prototype) {
            return (prototype.scrollBy = function scrollBy() {
                if (arguments.length === 1) {
                    var scrollByOptions = arguments[0];
                    if (!isObject(scrollByOptions)) {
                        throw new TypeError("Failed to execute 'scrollBy' on 'Element': parameter 1 ('options') is not an object.");
                    }
                    return elementScrollBy(this, __assign(__assign({}, scrollByOptions), animationOptions));
                }
                var left = Number(arguments[0]);
                var top = Number(arguments[1]);
                return elementScrollBy(this, { left: left, top: top });
            });
        });
    };

    // https://drafts.csswg.org/css-writing-modes-4/#block-flow
    var normalizeWritingMode = function (writingMode) {
        switch (writingMode) {
            case "horizontal-tb":
            case "lr":
            case "lr-tb":
            case "rl":
            case "rl-tb":
                return 0 /* HorizontalTb */;
            case "vertical-rl":
            case "tb":
            case "tb-rl":
                return 1 /* VerticalRl */;
            case "vertical-lr":
            case "tb-lr":
                return 2 /* VerticalLr */;
            case "sideways-rl":
                return 3 /* SidewaysRl */;
            case "sideways-lr":
                return 4 /* SidewaysLr */;
        }
        return 0 /* HorizontalTb */;
    };
    // https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/dom/element.cc;l=1097-1189;drc=6a7533d4a1e9f2372223a9d912a9e53a6fa35ae0
    var toPhysicalAlignment = function (options, writingMode, isLTR) {
        var _a;
        var _b = __read([options.block || "start", options.inline || "nearest"], 2), xPos = _b[0], yPos = _b[1];
        /**  0b{vertical}{horizontal}  0: normal, 1: reverse */
        var layout = 0;
        /**
         * WritingMode.VerticalLr: ↓→
         * | 1 | 4 |   |
         * | 2 | 5 |   |
         * | 3 |   |   |
         *
         * RTL: ↑→
         * | 3 |   |   |
         * | 2 | 5 |   |
         * | 1 | 4 |   |
         */
        if (!isLTR) {
            layout ^= 2 /* ReverseVertical */;
        }
        switch (writingMode) {
            /**
             * ↓→
             * | 1 | 2 | 3 |
             * | 4 | 5 |   |
             * |   |   |   |
             *
             * RTL: ↓←
             * | 3 | 2 | 1 |
             * |   | 5 | 4 |
             * |   |   |   |
             */
            case 0 /* HorizontalTb */:
                // swap horizontal and vertical
                layout = (layout >> 1) | ((layout & 1) << 1);
                _a = __read([yPos, xPos], 2), xPos = _a[0], yPos = _a[1];
                break;
            /**
             * ↓←
             * |   | 4 | 1 |
             * |   | 5 | 2 |
             * |   |   | 3 |
             *
             * RTL: ↑←
             * |   |   | 3 |
             * |   | 5 | 2 |
             * |   | 4 | 1 |
             */
            case 1 /* VerticalRl */:
            case 3 /* SidewaysRl */:
                //  reverse horizontal
                layout ^= 1 /* ReverseHorizontal */;
                break;
            /**
             * ↑→
             * | 3 |   |   |
             * | 2 | 5 |   |
             * | 1 | 4 |   |
             *
             * RTL: ↓→
             * | 1 | 4 |   |
             * | 2 | 5 |   |
             * | 3 |   |   |
             */
            case 4 /* SidewaysLr */:
                // reverse vertical
                layout ^= 2 /* ReverseVertical */;
                break;
        }
        return [xPos, yPos].map(function (value, index) {
            switch (value) {
                case "center":
                    return 1 /* CenterAlways */;
                case "nearest":
                    return 0 /* ToEdgeIfNeeded */;
                default: {
                    var reverse = (layout >> index) & 1;
                    return (value === "start") === !reverse ? 2 /* LeftOrTop */ : 3 /* RightOrBottom */;
                }
            }
        });
    };
    // code from stipsan/compute-scroll-into-view
    // https://github.com/stipsan/compute-scroll-into-view/blob/5396c6b78af5d0bbce11a7c4e93cc3146546fcd3/src/index.ts
    /**
     * Find out which edge to align against when logical scroll position is "nearest"
     * Interesting fact: "nearest" works similarily to "if-needed", if the element is fully visible it will not scroll it
     *
     * Legends:
     * ┌────────┐ ┏ ━ ━ ━ ┓
     * │ target │   frame
     * └────────┘ ┗ ━ ━ ━ ┛
     */
    var alignNearest = function (scrollingEdgeStart, scrollingEdgeEnd, scrollingSize, scrollingBorderStart, scrollingBorderEnd, elementEdgeStart, elementEdgeEnd, elementSize) {
        /**
         * If element edge A and element edge B are both outside scrolling box edge A and scrolling box edge B
         *
         *          ┌──┐
         *        ┏━│━━│━┓
         *          │  │
         *        ┃ │  │ ┃        do nothing
         *          │  │
         *        ┗━│━━│━┛
         *          └──┘
         *
         *  If element edge C and element edge D are both outside scrolling box edge C and scrolling box edge D
         *
         *    ┏ ━ ━ ━ ━ ┓
         *   ┌───────────┐
         *   │┃         ┃│        do nothing
         *   └───────────┘
         *    ┗ ━ ━ ━ ━ ┛
         */
        if ((elementEdgeStart < scrollingEdgeStart && elementEdgeEnd > scrollingEdgeEnd) ||
            (elementEdgeStart > scrollingEdgeStart && elementEdgeEnd < scrollingEdgeEnd)) {
            return 0;
        }
        /**
         * If element edge A is outside scrolling box edge A and element height is less than scrolling box height
         *
         *          ┌──┐
         *        ┏━│━━│━┓         ┏━┌━━┐━┓
         *          └──┘             │  │
         *  from  ┃      ┃     to  ┃ └──┘ ┃
         *
         *        ┗━ ━━ ━┛         ┗━ ━━ ━┛
         *
         * If element edge B is outside scrolling box edge B and element height is greater than scrolling box height
         *
         *        ┏━ ━━ ━┓         ┏━┌━━┐━┓
         *                           │  │
         *  from  ┃ ┌──┐ ┃     to  ┃ │  │ ┃
         *          │  │             │  │
         *        ┗━│━━│━┛         ┗━│━━│━┛
         *          │  │             └──┘
         *          │  │
         *          └──┘
         *
         * If element edge C is outside scrolling box edge C and element width is less than scrolling box width
         *
         *       from                 to
         *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *  ┌───┐                 ┌───┐
         *  │ ┃ │       ┃         ┃   │     ┃
         *  └───┘                 └───┘
         *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         * If element edge D is outside scrolling box edge D and element width is greater than scrolling box width
         *
         *       from                 to
         *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *        ┌───────────┐   ┌───────────┐
         *    ┃   │     ┃     │   ┃         ┃ │
         *        └───────────┘   └───────────┘
         *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         */
        if ((elementEdgeStart <= scrollingEdgeStart && elementSize <= scrollingSize) ||
            (elementEdgeEnd >= scrollingEdgeEnd && elementSize >= scrollingSize)) {
            return elementEdgeStart - scrollingEdgeStart - scrollingBorderStart;
        }
        /**
         * If element edge B is outside scrolling box edge B and element height is less than scrolling box height
         *
         *        ┏━ ━━ ━┓         ┏━ ━━ ━┓
         *
         *  from  ┃      ┃     to  ┃ ┌──┐ ┃
         *          ┌──┐             │  │
         *        ┗━│━━│━┛         ┗━└━━┘━┛
         *          └──┘
         *
         * If element edge A is outside scrolling box edge A and element height is greater than scrolling box height
         *
         *          ┌──┐
         *          │  │
         *          │  │             ┌──┐
         *        ┏━│━━│━┓         ┏━│━━│━┓
         *          │  │             │  │
         *  from  ┃ └──┘ ┃     to  ┃ │  │ ┃
         *                           │  │
         *        ┗━ ━━ ━┛         ┗━└━━┘━┛
         *
         * If element edge C is outside scrolling box edge C and element width is greater than scrolling box width
         *
         *           from                 to
         *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *  ┌───────────┐           ┌───────────┐
         *  │     ┃     │   ┃       │ ┃         ┃
         *  └───────────┘           └───────────┘
         *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         * If element edge D is outside scrolling box edge D and element width is less than scrolling box width
         *
         *           from                 to
         *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
         *                ┌───┐             ┌───┐
         *        ┃       │ ┃ │       ┃     │   ┃
         *                └───┘             └───┘
         *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
         *
         */
        if ((elementEdgeEnd > scrollingEdgeEnd && elementSize < scrollingSize) ||
            (elementEdgeStart < scrollingEdgeStart && elementSize > scrollingSize)) {
            return elementEdgeEnd - scrollingEdgeEnd + scrollingBorderEnd;
        }
        return 0;
    };
    var canOverflow = function (overflow) {
        return overflow !== "visible" && overflow !== "clip";
    };
    var getFrameElement = function (element) {
        if (!element.ownerDocument || !element.ownerDocument.defaultView) {
            return null;
        }
        try {
            return element.ownerDocument.defaultView.frameElement;
        }
        catch (e) {
            return null;
        }
    };
    var isHiddenByFrame = function (element) {
        var frame = getFrameElement(element);
        if (!frame) {
            return false;
        }
        return frame.clientHeight < element.scrollHeight || frame.clientWidth < element.scrollWidth;
    };
    var isScrollable = function (element, computedStyle) {
        if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
            return canOverflow(computedStyle.overflowY) || canOverflow(computedStyle.overflowX) || isHiddenByFrame(element);
        }
        return false;
    };
    var parentElement = function (element) {
        var parentNode = element.parentNode;
        if (parentNode !== null && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            return parentNode.host;
        }
        return parentNode;
    };
    var clamp = function (value, width) {
        if (value < -width) {
            return -width;
        }
        if (value > width) {
            return width;
        }
        return value;
    };
    var isCSSPropertySupported = function (property) { return property in document.documentElement.style; };
    var getSupportedScrollMarginProperty = function () {
        // Webkit uses "scroll-snap-margin" https://bugs.webkit.org/show_bug.cgi?id=189265.
        return ["scroll-margin", "scroll-snap-margin"].filter(isCSSPropertySupported)[0];
    };
    var getElementScrollSnapArea = function (element, computedStyle) {
        var _a = element.getBoundingClientRect(), top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left;
        var _b = __read([
            "top",
            "right",
            "bottom",
            "left",
        ].map(function (edge) {
            var scrollProperty = getSupportedScrollMarginProperty();
            var value = computedStyle.getPropertyValue(scrollProperty + "-" + edge);
            return parseInt(value, 10) || 0;
        }), 4), scrollMarginTop = _b[0], scrollMarginRight = _b[1], scrollMarginBottom = _b[2], scrollMarginLeft = _b[3];
        return [top - scrollMarginTop, right + scrollMarginRight, bottom + scrollMarginBottom, left - scrollMarginLeft];
    };
    var elementScrollIntoView = function (element, options) {
        if (element.isConnected === false) {
            return;
        }
        // On Chrome and Firefox, document.scrollingElement will return the <html> element.
        // Safari, document.scrollingElement will return the <body> element.
        // On Edge, document.scrollingElement will return the <body> element.
        // IE11 does not support document.scrollingElement, but you can assume its <html>.
        // Used to handle the top most element that can be scrolled
        var scrollingElement = document.scrollingElement || document.documentElement;
        // Collect all the scrolling boxes, as defined in the spec: https://drafts.csswg.org/cssom-view/#scrolling-box
        var frames = [];
        var documentElementStyle = getComputedStyle(document.documentElement);
        for (var cursor = parentElement(element); cursor !== null; cursor = parentElement(cursor)) {
            // Stop when we reach the viewport
            if (cursor === scrollingElement) {
                frames.push(cursor);
                break;
            }
            var cursorStyle = getComputedStyle(cursor);
            // Skip document.body if it's not the scrollingElement and documentElement isn't independently scrollable
            if (cursor === document.body &&
                isScrollable(cursor, cursorStyle) &&
                !isScrollable(document.documentElement, documentElementStyle)) {
                continue;
            }
            // Now we check if the element is scrollable,
            // this code only runs if the loop haven't already hit the viewport or a custom boundary
            if (isScrollable(cursor, cursorStyle)) {
                frames.push(cursor);
            }
            if (cursorStyle.position === "fixed") {
                break;
            }
        }
        // Support pinch-zooming properly, making sure elements scroll into the visual viewport
        // Browsers that don't support visualViewport
        // will report the layout viewport dimensions on document.documentElement.clientWidth/Height
        // and viewport dimensions on window.innerWidth/Height
        // https://www.quirksmode.org/mobile/viewports2.html
        // https://bokand.github.io/viewport/index.html
        var viewportWidth = window.visualViewport ? window.visualViewport.width : innerWidth;
        var viewportHeight = window.visualViewport ? window.visualViewport.height : innerHeight;
        // Newer browsers supports scroll[X|Y], page[X|Y]Offset is
        var viewportX = window.scrollX || window.pageXOffset;
        var viewportY = window.scrollY || window.pageYOffset;
        var computedStyle = getComputedStyle(element);
        var _a = __read(getElementScrollSnapArea(element, computedStyle), 4), targetTop = _a[0], targetRight = _a[1], targetBottom = _a[2], targetLeft = _a[3];
        var targetHeight = targetBottom - targetTop;
        var targetWidth = targetRight - targetLeft;
        var writingMode = normalizeWritingMode(computedStyle.writingMode ||
            computedStyle.getPropertyValue("-webkit-writing-mode") ||
            computedStyle.getPropertyValue("-ms-writing-mode"));
        var isLTR = computedStyle.direction !== "rtl";
        var _b = __read(toPhysicalAlignment(options, writingMode, isLTR), 2), alignX = _b[0], alignY = _b[1];
        var targetBlock = (function () {
            switch (alignY) {
                case 1 /* CenterAlways */:
                    return targetTop + targetHeight / 2;
                case 2 /* LeftOrTop */:
                case 0 /* ToEdgeIfNeeded */:
                    return targetTop;
                case 3 /* RightOrBottom */:
                    return targetBottom;
            }
        })();
        var targetInline = (function () {
            switch (alignX) {
                case 1 /* CenterAlways */:
                    return targetLeft + targetWidth / 2;
                case 3 /* RightOrBottom */:
                    return targetRight;
                case 2 /* LeftOrTop */:
                case 0 /* ToEdgeIfNeeded */:
                    return targetLeft;
            }
        })();
        var actions = [];
        frames.forEach(function (frame) {
            var _a = frame.getBoundingClientRect(), height = _a.height, width = _a.width, top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left;
            var frameStyle = getComputedStyle(frame);
            var borderLeft = parseInt(frameStyle.borderLeftWidth, 10);
            var borderTop = parseInt(frameStyle.borderTopWidth, 10);
            var borderRight = parseInt(frameStyle.borderRightWidth, 10);
            var borderBottom = parseInt(frameStyle.borderBottomWidth, 10);
            var blockScroll = 0;
            var inlineScroll = 0;
            // The property existance checks for offfset[Width|Height] is because only HTMLElement objects have them,
            // but any Element might pass by here
            // @TODO find out if the "as HTMLElement" overrides can be dropped
            var scrollbarWidth = "offsetWidth" in frame
                ? frame.offsetWidth - frame.clientWidth - borderLeft - borderRight
                : 0;
            var scrollbarHeight = "offsetHeight" in frame
                ? frame.offsetHeight - frame.clientHeight - borderTop - borderBottom
                : 0;
            if (scrollingElement === frame) {
                // Handle viewport logic (document.documentElement or document.body)
                switch (alignY) {
                    case 2 /* LeftOrTop */: {
                        blockScroll = targetBlock;
                        break;
                    }
                    case 3 /* RightOrBottom */: {
                        blockScroll = targetBlock - viewportHeight;
                        break;
                    }
                    case 1 /* CenterAlways */: {
                        blockScroll = targetBlock - viewportHeight / 2;
                        break;
                    }
                    case 0 /* ToEdgeIfNeeded */: {
                        blockScroll = alignNearest(viewportY, viewportY + viewportHeight, viewportHeight, borderTop, borderBottom, viewportY + targetBlock, viewportY + targetBlock + targetHeight, targetHeight);
                        break;
                    }
                }
                switch (alignX) {
                    case 2 /* LeftOrTop */: {
                        inlineScroll = targetInline;
                        break;
                    }
                    case 3 /* RightOrBottom */: {
                        inlineScroll = targetInline - viewportWidth;
                        break;
                    }
                    case 1 /* CenterAlways */: {
                        inlineScroll = targetInline - viewportWidth / 2;
                        break;
                    }
                    case 0 /* ToEdgeIfNeeded */: {
                        inlineScroll = alignNearest(viewportX, viewportX + viewportWidth, viewportWidth, borderLeft, borderRight, viewportX + targetInline, viewportX + targetInline + targetWidth, targetWidth);
                        break;
                    }
                }
                blockScroll += viewportY;
                inlineScroll += viewportX;
            }
            else {
                // Handle each scrolling frame that might exist between the target and the viewport
                switch (alignY) {
                    case 2 /* LeftOrTop */: {
                        blockScroll = targetBlock - top - borderTop;
                        break;
                    }
                    case 3 /* RightOrBottom */: {
                        blockScroll = targetBlock - bottom + borderBottom + scrollbarHeight;
                        break;
                    }
                    case 1 /* CenterAlways */: {
                        blockScroll = targetBlock - (top + height / 2) + scrollbarHeight / 2;
                        break;
                    }
                    case 0 /* ToEdgeIfNeeded */: {
                        blockScroll = alignNearest(top, bottom, height, borderTop, borderBottom + scrollbarHeight, targetBlock, targetBlock + targetHeight, targetHeight);
                        break;
                    }
                }
                switch (alignX) {
                    case 2 /* LeftOrTop */: {
                        inlineScroll = targetInline - left - borderLeft;
                        break;
                    }
                    case 3 /* RightOrBottom */: {
                        inlineScroll = targetInline - right + borderRight + scrollbarWidth;
                        break;
                    }
                    case 1 /* CenterAlways */: {
                        inlineScroll = targetInline - (left + width / 2) + scrollbarWidth / 2;
                        break;
                    }
                    case 0 /* ToEdgeIfNeeded */: {
                        inlineScroll = alignNearest(left, right, width, borderLeft, borderRight + scrollbarWidth, targetInline, targetInline + targetWidth, targetWidth);
                        break;
                    }
                }
                var scrollLeft = frame.scrollLeft, scrollTop = frame.scrollTop;
                // Ensure scroll coordinates are not out of bounds while applying scroll offsets
                blockScroll = clamp(scrollTop + blockScroll, frame.scrollHeight - height + scrollbarHeight);
                inlineScroll = clamp(scrollLeft + inlineScroll, frame.scrollWidth - width + scrollbarWidth);
                // Cache the offset so that parent frames can scroll this into view correctly
                targetBlock += scrollTop - blockScroll;
                targetInline += scrollLeft - inlineScroll;
            }
            actions.push(function () { return elementScroll(frame, __assign(__assign({}, options), { top: blockScroll, left: inlineScroll })); });
        });
        actions.forEach(function (run) { return run(); });
    };
    var elementScrollIntoViewPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        var originalFunc = original.elementScrollIntoView;
        modifyPrototypes(function (prototype) {
            return (prototype.scrollIntoView = function scrollIntoView() {
                var scrollIntoViewOptions = arguments[0];
                if (arguments.length === 1 && isObject(scrollIntoViewOptions)) {
                    return elementScrollIntoView(this, __assign(__assign({}, scrollIntoViewOptions), animationOptions));
                }
                return originalFunc.apply(this, arguments);
            });
        });
    };

    var elementScrollToPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        var originalFunc = original.elementScroll;
        modifyPrototypes(function (prototype) {
            return (prototype.scrollTo = function scrollTo() {
                if (arguments.length === 1) {
                    var scrollToOptions = arguments[0];
                    if (!isObject(scrollToOptions)) {
                        throw new TypeError("Failed to execute 'scrollTo' on 'Element': parameter 1 ('options') is not an object.");
                    }
                    var left = Number(scrollToOptions.left);
                    var top_1 = Number(scrollToOptions.top);
                    return elementScroll(this, __assign(__assign(__assign({}, scrollToOptions), { left: left, top: top_1 }), animationOptions));
                }
                return originalFunc.apply(this, arguments);
            });
        });
    };

    var windowScroll = function (options) {
        var _a, _b;
        var originalBoundFunc = original.windowScroll.bind(window);
        if (options.left === undefined && options.top === undefined) {
            return;
        }
        var startX = window.scrollX || window.pageXOffset;
        var startY = window.scrollY || window.pageYOffset;
        var targetX = nonFinite((_a = options.left) !== null && _a !== void 0 ? _a : startX);
        var targetY = nonFinite((_b = options.top) !== null && _b !== void 0 ? _b : startY);
        if (options.behavior !== "smooth") {
            return originalBoundFunc(targetX, targetY);
        }
        var removeEventListener = function () {
            window.removeEventListener("wheel", cancelScroll);
            window.removeEventListener("touchmove", cancelScroll);
        };
        var context = {
            timeStamp: now(),
            duration: options.duration,
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            rafId: 0,
            method: originalBoundFunc,
            timingFunc: options.timingFunc,
            callback: removeEventListener,
        };
        var cancelScroll = function () {
            cancelAnimationFrame(context.rafId);
            removeEventListener();
        };
        window.addEventListener("wheel", cancelScroll, {
            passive: true,
            once: true,
        });
        window.addEventListener("touchmove", cancelScroll, {
            passive: true,
            once: true,
        });
        step(context);
    };
    var windowScrollPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        var originalFunc = original.windowScroll;
        window.scroll = function scroll() {
            if (arguments.length === 1) {
                var scrollOptions = arguments[0];
                if (!isObject(scrollOptions)) {
                    throw new TypeError("Failed to execute 'scroll' on 'Window': parameter 1 ('options') is not an object.");
                }
                return windowScroll(__assign(__assign({}, scrollOptions), animationOptions));
            }
            return originalFunc.apply(this, arguments);
        };
    };

    var windowScrollBy = function (options) {
        var left = nonFinite(options.left || 0) + (window.scrollX || window.pageXOffset);
        var top = nonFinite(options.top || 0) + (window.scrollY || window.pageYOffset);
        if (options.behavior !== "smooth") {
            return original.windowScroll.call(window, left, top);
        }
        return windowScroll(__assign(__assign({}, options), { left: left, top: top }));
    };
    var windowScrollByPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        window.scrollBy = function scrollBy() {
            if (arguments.length === 1) {
                var scrollByOptions = arguments[0];
                if (!isObject(scrollByOptions)) {
                    throw new TypeError("Failed to execute 'scrollBy' on 'Window': parameter 1 ('options') is not an object.");
                }
                return windowScrollBy(__assign(__assign({}, scrollByOptions), animationOptions));
            }
            var left = Number(arguments[0]);
            var top = Number(arguments[1]);
            return windowScrollBy({ left: left, top: top });
        };
    };

    var windowScrollToPolyfill = function (animationOptions) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        var originalFunc = original.windowScroll;
        window.scrollTo = function scrollTo() {
            if (arguments.length === 1) {
                var scrollToOptions = arguments[0];
                if (!isObject(scrollToOptions)) {
                    throw new TypeError("Failed to execute 'scrollTo' on 'Window': parameter 1 ('options') is not an object.");
                }
                var left = Number(scrollToOptions.left);
                var top_1 = Number(scrollToOptions.top);
                return windowScroll(__assign(__assign(__assign({}, scrollToOptions), { left: left, top: top_1 }), animationOptions));
            }
            return originalFunc.apply(this, arguments);
        };
    };

    var polyfill = function (options) {
        if (isScrollBehaviorSupported()) {
            return;
        }
        windowScrollPolyfill(options);
        windowScrollToPolyfill(options);
        windowScrollByPolyfill(options);
        elementScrollPolyfill(options);
        elementScrollToPolyfill(options);
        elementScrollByPolyfill(options);
        elementScrollIntoViewPolyfill(options);
    };

    exports.elementScroll = elementScroll;
    exports.elementScrollBy = elementScrollBy;
    exports.elementScrollByPolyfill = elementScrollByPolyfill;
    exports.elementScrollIntoView = elementScrollIntoView;
    exports.elementScrollIntoViewPolyfill = elementScrollIntoViewPolyfill;
    exports.elementScrollPolyfill = elementScrollPolyfill;
    exports.elementScrollTo = elementScroll;
    exports.elementScrollToPolyfill = elementScrollToPolyfill;
    exports.polyfill = polyfill;
    exports.seamless = polyfill;
    exports.windowScroll = windowScroll;
    exports.windowScrollBy = windowScrollBy;
    exports.windowScrollByPolyfill = windowScrollByPolyfill;
    exports.windowScrollPolyfill = windowScrollPolyfill;
    exports.windowScrollTo = windowScroll;
    exports.windowScrollToPolyfill = windowScrollToPolyfill;

    Object.defineProperty(exports, '__esModule', { value: true });

})));

})
('object' === typeof window && window || 'object' === typeof self && self || 'object' === typeof global && global || {});
