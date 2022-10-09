<?php
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");	?>
        <div class="container">
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
                    </div>

                    <div id="filterscollapse"></div>
                    <div id="filtershdr" class="filters-heading">
                        <div class="filters-heading__icon">
                            <?=svgIcon("filter", "filter-icon")?>
                        </div>
                        <label>Filters</label>
                        <a id="clearall_btn" class="clear-all-btn" href="<?=e($clearAllURL)?>">
                            <?=svgIcon("close", "clear-all-icon")?>
                            <span>Clear all</span>
                        </a>
                        <button class="btn icon-btn toggle-btn right-align" type="button">
                            <svg class="icon toggle-icon"><use href="#toggle-ext"></use></svg>
                        </button>
                    </div>

                    <div id="filters" class="filters-container">
                        <div class="filter-item">
                            <h3 class="filter-item__title">Type</h3>
                            <div class="trtype-menu trtype-menu-multi">
<?php	foreach($transMenu as $menuItem) {  ?>
<?php       if ($menuItem->type == 0) {		?>
<?php           if ($menuItem->selected) {		?>
                                <span class="trtype-menu__item trtype-menu_item_title" data-type="<?=e($menuItem->type)?>">
<?php		    } else {		?>
                                <span class="trtype-menu__item trtype-menu_item_title trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
<?php	    	}				?>
                                    <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                </span>
<?php		} else {		?>
                                <label class="checkbox trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                    <input type="checkbox"<?=checked($menuItem->selected)?>>
                                    <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                                    <span class="checkbox__label">
                                        <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                    </span>
                                </label>
<?php		}				?>
<?php	}			?>
                            </div>
                        </div>

                        <div id="accountsFilter" class="filter-item">
                            <h3 class="filter-item__title">Accounts</h3>
                            <select id="acc_id" name="acc_id" multiple></select>
                        </div>

                        <div id="personsFilter" class="filter-item">
                            <h3 class="filter-item__title">Persons</h3>
                            <select id="person_id" name="person_id" multiple></select>
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Date range</h3>
                            <?=IconLink::render([
                                "id" => "calendar_btn",
                                "icon" => "cal",
                                "title" => "Select range",
                                "subtitle" => $dateFmt
                            ])?>
                            <div id="date_block" class="column-container" hidden>
                                <div class="input-group">
                                    <input id="date" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                    <button id="nodatebtn" class="input-group__inner-btn" type="button"<?=hidden(is_empty($dateFmt))?>>
                                        <?=svgIcon("close", "input-group__inner-btn__icon")?>
                                    </button>
                                    <button id="cal_rbtn" class="btn icon-btn input-group__btn" type="button">
                                        <svg class="icon calendar-icon"><use href="#calendar-icon"></use></svg>
                                    </button>
                                </div>
                                <div id="calendar" class="calendar"></div>
                            </div>
                        </div>

                        <div class="filter-item">
                            <h3 class="filter-item__title">Search</h3>
                            <form id="searchFrm" method="get" action="<?=BASEURL?>transactions/">
                            <div class="input-group">
                                <input id="search" class="input-group__input stretch-input" name="search" type="text" autocomplete="off" value="<?=(is_null($searchReq) ? "" : e($searchReq))?>">
                                <button id="nosearchbtn" class="input-group__inner-btn" type="button"<?=hidden(is_empty($searchReq))?>>
                                    <?=svgIcon("close", "input-group__inner-btn__icon")?>
                                </button>
                                <button class="btn icon-btn search_btn input-group__btn" type="submit"><?=svgIcon("search", "icon search-icon")?></button>
                            </div>
                            </form>
                        </div>
                    </div>

                    <div class="list-container">
                        <div class="paginator-row">
                            <div class="mode-selector"></div>
                            <div class="paginator"></div>
                        </div>

                        <div class="trans-list"></div>

                        <div class="paginator-row">
                            <div class="paginator"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="toolbar" class="sidebar" hidden>
        <div class="siderbar__content">
            <div id="sbEllipsis" class="sidebar__ellipsis"><?=svgIcon("sbellipsis", "icon")?></div>
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

<?php	include(ICONS_PATH . "Common.tpl");	?>
<?php	include(ICONS_PATH . "ModeSelector.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
