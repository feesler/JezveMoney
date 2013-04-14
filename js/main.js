// Show/hide user menu by click
function onUserClick()
{
	var menupopup;

	menupopup = ge('menupopup');
	if (!menupopup)
		return;

	show(menupopup, !isVisible(menupopup));
}
