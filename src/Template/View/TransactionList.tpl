<?php

use JezveMoney\App\Template\Component\IconButton;
use JezveMoney\App\Template\Component\DateRangeInput;
use JezveMoney\App\Template\Component\LinkMenu;

include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div id="heading" class="heading">
                        <h1>Transactions</h1>
                        <div class="heading-actions">
                            <?= IconButton::render([
                                "id" => "add_btn",
                                "type" => "link",
                                "classNames" => "circle-icon",
                                "link" => BASEURL . "transactions/create/",
                                "title" => "Create",
                                "icon" => "plus"
                            ]) ?>
                        </div>
                    </div>

                    <div id="filterscollapse"></div>
                    <div id="filtershdr" class="filters-heading">
                        <div class="filters-heading__icon">
                            <?= svgIcon("filter", "filter-icon") ?>
                        </div>
                        <label>Filters</label>
                        <a id="clearall_btn" class="clear-all-btn" href="<?= e($clearAllURL) ?>">
                            <?= svgIcon("close", "clear-all-icon") ?>
                            <span>Clear all</span>
                        </a>
                        <button class="btn icon-btn toggle-btn right-align" type="button">
                            <svg class="icon toggle-icon">
                                <use href="#toggle-ext"></use>
                            </svg>
                        </button>
                    </div>

                    <div id="filters" class="filters-container">
                        <div class="filter-item">
                            <h3 class="filter-item__title">Type</h3>
                            <?= LinkMenu::render([
                                "id" => "type_menu",
                                "classNames" => "trtype-menu",
                                "multiple" => true,
                                "items" => $typeMenu,
                            ]) ?>
                        </div>

                        <div class="filters-row">
                            <div id="accountsFilter" class="filter-item">
                                <h3 class="filter-item__title">Accounts and persons</h3>
                                <select id="acc_id" name="acc_id" multiple></select>
                            </div>
                        </div>

                        <div class="filters-row">
                            <div id="dateFilter" class="filter-item date-range-filter validation-block">
                                <h3 class="filter-item__title">Date range</h3>
                                <?= DateRangeInput::render($dateRange) ?>
                            </div>

                            <div id="searchFilter" class="filter-item">
                                <h3 class="filter-item__title">Search</h3>
                            </div>
                        </div>
                    </div>

                    <div class="list-container">
                        <div class="list-header">
                            <div id="counters" class="counters">
                                <div id="itemsCounter" class="counter">
                                    <span class="counter__title">Items</span>
                                    <span id="itemsCount" class="counter__value"></span>
                                </div>
                                <div id="selectedCounter" class="counter" hidden>
                                    <span class="counter__title">Selected</span>
                                    <span id="selItemsCount" class="counter__value"></span>
                                </div>
                            </div>
                        </div>
                        <div class="list-footer"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(ICONS_PATH . "ModeSelector.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>