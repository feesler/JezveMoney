// Popup constructor
var Popup = new (function()
{
	// Modal instance constructor
	function Modal(params)
	{
		var popupObj = null;
		var backObj = null;
		var contentObj = null;
		var boxObj = null;
		var titleObj = null;
		var messageObj = null;
		var controlsObj = null;
		var okBtn = null;
		var cancelBtn = null;
		var closeBtn = null;
		var onCloseHandler = null;
		var _params = null;
		var self = this;


		// Set click handler for close button
		function setOnClose(elem)
		{
			btn = (elem) ? elem.firstElementChild : null;
			if (btn)
				btn.onclick = closeModal.bind(self);
		}


		// Add close button to the popup
		function addCloseButton()
		{
			if (!boxObj || closeBtn)
				return;

			closeBtn = ce('button', { className : 'close_btn', type : 'button' },
							svg('svg', {},
								svg('path', { d : 'M 1.1415,2.4266 5.7838,7 1.1415,11.5356 2.4644,12.8585 7,8.2162 11.5734,12.8585 12.8585,11.5356 8.2162,7 12.8585,2.4266 11.5734,1.1415 7,5.7838 2.4644,1.1415 Z' })));
			boxObj.appendChild(closeBtn);

			setOnClose(closeBtn);
		}


		// Remove close button
		function removeCloseButton()
		{
			re(closeBtn);
			closeBtn = null;
		}


		function create(params)
		{
			if (!params || !params.id)
				return false;

			_params = params;

			// check popup with same id is already exist
			popupObj = ge(params.id);
			if (popupObj)
				return false;

			popupObj = ce('div', { id : params.id, className : 'popup', style : { display : 'none' } });
			if (!popupObj)
				return false;

			backObj = ce('div', { className : 'popup_back' });
			if (!backObj)
				return false;

			if (params.nodim === true)
				show(backObj, false);

			if (isFunction(params.onclose))
				this.onCloseHandler = params.onclose;

			if (!setModalContent(params.content))
				return false;

			contentObj = ce('div', { className : 'popup_content' });
			boxObj = ce('div', { className : 'box' });
			if (!contentObj || !boxObj)
				return false;

			if (Array.isArray(params.additional) || typeof params.additional === 'string')
			{
				var addClassNames = (Array.isArray(params.additional)) ? params.additional : params.additional.split(' ');

				addClassNames.forEach(function(item)
				{
					contentObj.classList.add(item);
				});
			}

			prependChild(boxObj, messageObj);

			setModalTitle(params.title);

			setModalControls(params.btn);

			contentObj.appendChild(boxObj);

			show(messageObj, true);

			addChilds(popupObj, [backObj, contentObj]);

			document.body.appendChild(popupObj);

			return true;
		}


		function setModalContent(content)
		{
			var newMessageObj;

			if (!content)
				return false;

			if (typeof content == 'string')
				newMessageObj = ce('div', { className : 'popup_message' }, ce('div', { innerHTML : content }) );
			else
				newMessageObj = content;

			if (messageObj)
			{
				insertBefore(newMessageObj, messageObj);
				re(messageObj);
			}

			messageObj = newMessageObj;

			return true;
		}


		function setModalTitle(titleStr)
		{
			if (!titleStr)
				return;

			if (!titleObj)
			{
				titleObj = ce('h1', { className : 'popup_title', innerHTML : params.title });
				prependChild(boxObj, titleObj);
			}

			titleObj.innerHTML = titleStr;
		}


		function removeModalTitle()
		{
			re(titleObj);
			titleObj = null;
		}


		function setModalControls(params)
		{
			var hasControls, newHasControls;

			if (!params)
				return false;

			hasControls = (okBtn || cancelBtn);
			newHasControls = (params.okBtn !== false || params.cancelBtn !== false);
			if (newHasControls)
			{
				if (!controlsObj)
					controlsObj = ce('div', { className : 'popup_controls' });
			}
			else
			{
				re(controlsObj);
				controlsObj = null;
			}

			if (params.okBtn !== undefined)
			{
				if (params.okBtn === false && okBtn)
				{
					re(okBtn);
					okBtn = null;
				}
				else
				{
					if (!okBtn)
						okBtn = ce('input', { className : 'btn ok_btn',
												type : 'button', value : 'ok' });

					setParam(okBtn, params.okBtn);
				}
			}

			if (params.cancelBtn !== undefined)
			{
				if (params.cancelBtn === false && cancelBtn)
				{
					re(cancelBtn);
					cancelBtn = null;
				}
				else
				{
					if (!cancelBtn)
						cancelBtn = ce('input', { className : 'btn cancel_btn',
													type : 'button', value : 'cancel',
													onclick : closeModal.bind(self) });

					setParam(cancelBtn, params.cancelBtn);
				}
			}

			if (newHasControls)
			{
				addChilds(controlsObj, [okBtn, cancelBtn]);
				insertAfter(controlsObj, messageObj);
			}

			if (params.closeBtn !== undefined)
			{
				if (params.closeBtn === true)
					addCloseButton();
				else if (params.closeBtn === false)
					removeCloseButton();
			}

			return true;
		}


		function showModal()
		{
			if (!popupObj)
				return;

			document.body.style.overflow = 'hidden';
			document.documentElement.scrollTop = 0;
			show(popupObj, true);

			if (_params.closeOnEmptyClick === true)
			{
				setTimeout(function()
				{
					setEmptyClick(closeModal.bind(self), [boxObj]);
				});
			}
		}


		function hideModal()
		{
			if (!popupObj)
				return;

			show(popupObj, false);
			document.body.style.overflow = '';

			if (_params.closeOnEmptyClick === true)
				setEmptyClick();
		}


		function closeModal()
		{
			hideModal();

			if (isFunction(onCloseHandler))
				onCloseHandler();
		}


		function destroyModal()
		{
			if (popupObj && popupObj.parentNode)
				popupObj.parentNode.removeChild(popupObj);
			popupObj = null;
		}

		create(params);

		// Modal public methods
		this.show = function()
		{
			showModal();
		}


		this.hide = function()
		{
			hideModal();
		}


		this.close = function()
		{
			closeModal();
		}


		this.destroy = function()
		{
			destroyModal();
		}


		this.setTitle = function(titleStr)
		{
			setModalTitle(titleStr);
		}


		this.removeTitle = function()
		{
			removeModalTitle();
		}


		this.setContent = function(content)
		{
			return setModalContent(content);
		}


		this.setControls = function(params)
		{
			return setModalControls(params);
		}
	}

// Popup global object public methods

	// @param {object} params:
	//   id {string} - identifier of element will be created for popup
	//   nodim {boolean} - option to not dim background on popup appear
	//   onclose {function} - popup close event handler
	//   additional {string|array} - list of additional CSS classes for popup
	//   title {string} - title of popup
	//   btn {object}:
	//     okBtn {false|object} - attributes of control. Removed if false is specified
	//     cancelBtn {false|object} - attributes of control. Removed if false is specified
	//     closeBtn {false|object} - attributes of control. Removed if false is specified
	this.create = function(params)
	{
		return new Modal(params);
	}
})();
