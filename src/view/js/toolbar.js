// Set top parameter of object
function setTop(obj, value)
{
	if (!obj)
		return;

	obj.style.top = px(parseInt(value));
}


// Update position of sidebar content
function onScroll()
{
	var clw, clh, clscroll;
	var tbContent;

	clw = document.documentElement.clientWidth;
	clscroll = getPageScroll();
	clh = document.documentElement.clientHeight;

	if (clw > 700 || !isVisible('toolbar'))
		return;

	tbContent = ge('tb_content');
	if (!tbContent)
		return;

	setTop(tbContent, clscroll.top + (clh - tbContent.offsetHeight) / 2);
}


// Toolbar click event handler
function onToolbarClick()
{
	var toolbar = ge('toolbar');
	if (!toolbar)
		return;

	toolbar.classList.toggle('sidebar_active');

	onScroll();
}


// Toolbar initialisation
function initToolbar()
{
	var toolbar;

	window.onscroll = onScroll;
	window.onresize = onScroll;

	toolbar = ge('toolbar');
	if (toolbar)
		toolbar.onclick = onToolbarClick;
}
