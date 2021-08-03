<?php
use JezveMoney\App\Template\TransactionList;
use JezveMoney\App\Template\IconLink;

include(TPL_PATH."commonhdr.tpl");
?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Transactions</h1>
                        <?=IconLink::render([
                            "id" => "add_btn",
                            "type" => "link",
                            "link" => BASEURL . "transactions/new/",
                            "title" => "New",
                            "icon" => "plus"
                        ])?>
                        <?=IconLink::render([
                            "id" => "import_btn",
                            "type" => "link",
                            "link" => BASEURL . "import/",
                            "title" => "Import",
                            "icon" => "import"
                        ])?>
                    </div>

                    <div>
                        <div class="trtype-menu trtype-menu-multi">
<?php	foreach($transMenu as $menuItem) {
            if ($menuItem->selected) {		?>
                            <span class="trtype-menu__item trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
<?php		} else {		?>
                            <span class="trtype-menu__item" data-type="<?=e($menuItem->type)?>">
<?php		}
            if ($menuItem->type != 0) {		?>
                                <span class="trtype-menu__item-check"><?=svgIcon("check")?></span>
<?php		}				?>
                                <span class="trtype-menu_item_title">
                                    <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                </span>
                            </span>
<?php	}			?>
                        </div>

                        <div class="filters-container">
                            <div class="filter-item std_margin">
                                <select id="acc_id" name="acc_id" multiple>
                                    <option value="0">All</option>
<?php	foreach($accArr as $accData) {
            if (in_array($accData->id, $accFilter)) {		?>
                                    <option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php		} else {		?>
                                    <option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		}
        }
        foreach($hiddenAccArr as $accData) {
            if (in_array($accData->id, $accFilter)) {		?>
                                    <option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php		} else {		?>
                                    <option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		}
        }	?>
                                </select>
                            </div>

                            <div class="filter-item std_margin">
                                <?=IconLink::render([
                                    "id" => "calendar_btn",
                                    "icon" => "cal",
                                    "title" => "Select range",
                                    "subtitle" => $dateFmt
                                ])?>
                                <div id="date_block" class="column-container hidden">
                                    <div class="input-group">
                                        <div class="stretch-input rbtn_input">
                                            <input id="date" name="date" type="text" value="<?=e($dateFmt)?>">
                                        </div>
                                        <button id="cal_rbtn" class="btn icon-btn" type="button"><?=svgIcon("cal")?></button>
                                    </div>
                                    <div id="calendar"></div>
                                </div>
                            </div>

                            <div class="filter-item search-filter-item std_margin">
                                <form id="searchFrm" method="get" action="<?=BASEURL?>transactions/">
                                <div class="input-group search-form">
                                    <div class="stretch-input rbtn_input">
                                        <input id="search" name="search" type="text" value="<?=(is_null($searchReq) ? "" : e($searchReq))?>">
                                    </div>
                                    <button class="btn icon-btn search_btn" type="submit"><?=svgIcon("search")?></button>
                                </div>
                                </form>
                            </div>
                        </div>

<?=TransactionList::render($listData)?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="toolbar" class="sidebar hidden">
        <div class="siderbar__content">
            <div id="sbEllipsis" class="sidebar__ellipsis"><?=svgIcon("sbellipsis")?></div>
            <div id="sbButtons" class="sidebar__controls">
                <?=IconLink::render([
                    "id" => "edit_btn",
                    "type" => "link",
                    "title" => "Edit",
                    "icon" => "edit",
                    "hidden" => true
                ])?>
                <?=IconLink::render([
                    "id" => "del_btn",
                    "title" => "Delete",
                    "icon" => "del",
                    "hidden" => true
                ])?>
            </div>
        </div>
    </div>
</div>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input id="deltrans" name="transactions" type="hidden" value="">
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
