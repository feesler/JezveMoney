function DecimalInput(props)
{
	this.props = props;

	if (!props.elem)
		throw new Error('Invalid input element specified');

	this.elem = props.elem;

	var beforeInputHandler = this.validateInput.bind(this);

	this.elem.addEventListener('keypress', beforeInputHandler);
	this.elem.addEventListener('paste', beforeInputHandler);
	this.elem.addEventListener('beforeinput', beforeInputHandler);

	if (isFunction(props.oninput))
	{
		this.oninput = props.oninput;
		this.elem.addEventListener('input', this.oninput);
	}
}


DecimalInput.create = function(props)
{
	if (!props || !props.elem)
		return null;

	return new DecimalInput(props);
}


DecimalInput.prototype.replaceSelection = function(text)
{
	var range = getCursorPos(this.elem);

	var origValue = this.elem.value;
	var beforeSelection = origValue.substr(0, range.start);
	var afterSelection = origValue.substr(range.end);

	return beforeSelection + text + afterSelection;
}


DecimalInput.prototype.getInputContent = function(e)
{
	if (e.type == 'paste')
	{
		return (e.clipboardData || window.clipboardData).getData('text');
	}
	else if (e.type == 'beforeinput')
	{
		return e.data;
	}
	else if (e.type == 'keypress')
	{
		return e.key;
	}
}


DecimalInput.prototype.validateInput = function(e)
{
	var inputContent = this.getInputContent(e);
	if (!inputContent || inputContent.length == 0)
		return true;

	var expectedContent = this.replaceSelection(inputContent);
	var res = isNum(fixFloat(expectedContent));
	if (!res)
	{
		e.preventDefault();
		e.stopPropagation();
	}

	return res;
}


