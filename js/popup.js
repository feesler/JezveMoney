// Popup constructor
function Popup()
{
	this.popupObj = null;
	this.backObj = null;
	this.contentObj = null;
	this.boxObj = null;
	this.titleObj = null;
	this.messageObj = null;
	this.controlsObj = null;
	this.okBtn = null;
	this.cancelBtn = null;


	this.mergeDef = function(obj, mergeObj)
	{
		var par, val;
	
		if (!obj || typeof obj !== 'object' || !mergeObj || typeof mergeObj !== 'object')
			return;

		for(par in mergeObj)
		{
			val = mergeObj[par];
			if (typeof val === 'object')
			{
				if (!(par in obj))
					obj[par] = {};
				this.mergeDef(obj[par], val);
			}
			else if (!(par in obj))
				obj[par] = val;
		}
	}


	this.create = function(params)
	{
		var popupObj, backObj, contentObj, boxObj, titleObj, messageObj, controlsObj, okBtn, cancelBtn;

		if (!params || !params.id || !params.title || !params.msg || !params.btn)
			return false;

		popupObj = ce('div', { id : params.id, className : 'popup', style : { display : 'none' } });
		if (!popupObj)
			return false;

		backObj = ce('div', { className : 'popup_back' });
		contentObj = ce('div', { className : 'popup_content' });
		boxObj = ce('div', { className : 'box' });
		if (!backObj || !contentObj || !boxObj)
			return false;

		titleObj = ce('h1', { className : 'popup_title', innerHTML : params.title });
		messageObj = ce('div', { className : 'popup_message' }, [ ce('div', { innerHTML : params.msg }) ]);
		controlsObj = ce('div', { className : 'popup_controls' });
		if (!titleObj || !messageObj || !controlsObj)
			return false;

		this.popupObj = popupObj;
		this.backObj = backObj;
		this.contentObj = contentObj;
		this.boxObj = boxObj;
		this.titleObj = titleObj;
		this.messageObj = messageObj;
		this.controlsObj = controlsObj;

		if (params.btn.okBtn)
		{
			okBtn = ce('input', { className : 'btn ok_btn' });
			if (!okBtn)
				return false;

			this.mergeDef(params.btn.okBtn, { type : 'button', value : 'ok' });
			setParam(okBtn, params.btn.okBtn);
			this.okBtn = okBtn;
		}

		if (params.btn.cancelBtn)
		{
			cancelBtn = ce('input', { className : 'btn cancel_btn' });
			if (!cancelBtn)
				return false;

			this.mergeDef(params.btn.cancelBtn, { type : 'button', value : 'cancel', onclick : this.close.bind(this) });
			setParam(cancelBtn, params.btn.cancelBtn);
			this.cancelBtn = cancelBtn;
		}

		addChilds(this.controlsObj, [this.okBtn, this.cancelBtn]);
		addChilds(this.boxObj, [this.titleObj, this.messageObj, this.controlsObj]);
		addChilds(this.contentObj, [this.boxObj]);
		addChilds(this.popupObj, [this.backObj, this.contentObj]);

		return true;
	},


	this.show = function()
	{
		if (!this.popupObj)
			return;

		document.body.appendChild(this.popupObj);
		document.body.style.overflow = 'hidden';
		document.documentElement.scrollTop = 0;
		show(this.popupObj, true);
	},


	this.hide = function()
	{
		if (!this.popupObj)
			return;

		show(this.popupObj, false);
		document.body.style.overflow = '';
	},


	this.close = function()
	{
		if (!this.popupObj)
			return;

		this.hide();

		this.popupObj.parentNode.removeChild(this.popupObj);
		this.popupObj = null;
	}
}
