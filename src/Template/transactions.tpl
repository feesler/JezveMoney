<?php
use JezveMoney\App\Template\Component\TransactionList;
use JezveMoney\App\Template\Component\IconLink;
use JezveMoney\App\Template\Component\Paginator;

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
                            "link" => BASEURL . "transactions/create/",
                            "title" => "Create",
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

                    <div id="filterscollapse"></div>
                    <div id="filtershdr" class="filters-heading">
                        <div class="filters-heading__icon">
                            <?=svgIcon("filter")?>
                        </div>
                        <label>Filters</label>
                        <a id="clearall_btn" class="clear-all-btn" href="<?=e($clearAllURL)?>">
                            <?=svgIcon("close")?>
                            <span>Clear all</span>
                        </a>
                        <button class="btn icon-btn toggle-btn right-align" type="button">
                            <svg><use href="#toggle-ext"></use></svg>
                        </button>
                    </div>

                    <div id="filters" class="filters-container">
                        <div class="filter-item">
                            <h3 class="filter-item__title">Type</h3>
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
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Accounts</h3>
                            <select id="acc_id" name="acc_id" multiple>
                                <option value="0">All</option>
<?php	foreach($accArr as $accData) {
            if (in_array($accData->id, $accFilter)) {		?>
                                <option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php		} else {		?>
                                <option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		}
        }
        if (count($hiddenAccArr) > 0) {     ?>
                                <optgroup label="Hidden">
<?php       foreach($hiddenAccArr as $accData) {
                if (in_array($accData->id, $accFilter)) {		?>
                                    <option value="<?=e($accData->id)?>" selected><?=e($accData->name)?></option>
<?php	    	} else {		?>
                                    <option value="<?=e($accData->id)?>"><?=e($accData->name)?></option>
<?php		    }
            }	?>
                                </optgroup>
<?php   }	?>
                            </select>
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Persons</h3>
                            <select id="person_id" name="person_id" multiple>
                                <option value="0">All</option>
<?php	foreach($personArr as $person) {
            if (in_array($person->id, $personFilter)) {		?>
                                <option value="<?=e($person->id)?>" selected><?=e($person->name)?></option>
<?php		} else {		?>
                                <option value="<?=e($person->id)?>"><?=e($person->name)?></option>
<?php		}
        }
        if (count($hiddenPersonArr) > 0) {     ?>
                                <optgroup label="Hidden">
<?php       foreach($hiddenPersonArr as $person) {
                if (in_array($person->id, $personFilter)) {		?>
                                    <option value="<?=e($person->id)?>" selected><?=e($person->name)?></option>
<?php	    	} else {		?>
                                    <option value="<?=e($person->id)?>"><?=e($person->name)?></option>
<?php		    }
            }	?>
                                </optgroup>
<?php   }	?>
                            </select>
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Date range</h3>
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
                                        <button id="nodatebtn" class="close-btn" type="button"><?=svgIcon("close")?></button>
                                    </div>
                                    <button id="cal_rbtn" class="btn icon-btn" type="button"><?=svgIcon("cal")?></button>
                                </div>
                                <div id="calendar"></div>
                            </div>
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Search</h3>
                            <form id="searchFrm" method="get" action="<?=BASEURL?>transactions/">
                            <div class="input-group search-form">
                                <div class="stretch-input rbtn_input">
                                    <input id="search" name="search" type="text" value="<?=(is_null($searchReq) ? "" : e($searchReq))?>">
                                    <button id="nosearchbtn" class="close-btn" type="button"><?=svgIcon("close")?></button>
                                </div>
                                <button class="btn icon-btn search_btn" type="submit"><?=svgIcon("search")?></button>
                            </div>
                            </form>
                        </div>
                    </div>

                    <div class="list-container">
                        <div class="paginator-row">
                            <div class="mode-selector">
<?php   if ($listData["showDetails"]) {		?>
                                <a class="mode-selector__item" href="<?=e($modeLink)?>" data-mode="classic">
                                    <span class="icon"><?=svgIcon("list")?></span>
                                    <span>Classic</span>
                                </a>
                                <b class="mode-selector__item mode-selector__item__active" data-mode="details">
                                    <span class="icon"><?=svgIcon("details")?></span>
                                    <span>Details</span>
                                </b>
<?php   } else {		?>
                                <b class="mode-selector__item mode-selector__item__active" data-mode="classic">
                                    <span class="icon"><?=svgIcon("list")?></span>
                                    <span>Classic</span>
                                </b>
                                <a class="mode-selector__item" href="<?=e($modeLink)?>" data-mode="details">
                                    <span class="icon"><?=svgIcon("details")?></span>
                                    <span>Details</span>
                                </a>
<?php   }	?>
                            </div>

                            <?=Paginator::render($paginator)?>
                        </div>

                        <?=TransactionList::render($listData)?>

                        <div class="paginator-row">
                            <?=Paginator::render($paginator)?>
                        </div>

                        <div class="trans-list__loading hidden">Loading...</div>
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

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
