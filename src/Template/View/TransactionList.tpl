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
                                "id" => "createBtn",
                                "type" => "link",
                                "classNames" => "circle-icon",
                                "link" => BASEURL . "transactions/create/",
                                "title" => "Create",
                                "icon" => "plus"
                            ]) ?>
                        </div>
                    </div>

                    <div id="contentHeader" class="content-header">
                        <?= IconButton::render([
                            "id" => "filtersBtn",
                            "classNames" => "filters-btn",
                            "icon" => "filter",
                            "title" => "Filters"
                        ]) ?>

                        <div id="filtersContainer" class="filters-container">
                            <div class="filters-heading">
                                <span class="filters-heading__title">Filters</span>
                                <button id="closeFiltersBtn" class="btn icon-btn close-btn right-align" type="button">
                                    <svg class="icon close-icon">
                                        <use href="#close"></use>
                                    </svg>
                                </button>
                            </div>

                            <div class="filters-list">
                                <div class="filters-row">
                                    <div class="filter-item trans-type-filter">
                                        <h3 class="filter-item__title">Type</h3>
                                        <?= LinkMenu::render([
                                            "id" => "typeMenu",
                                            "classNames" => "trtype-menu",
                                            "multiple" => true,
                                            "items" => $typeMenu,
                                        ]) ?>
                                    </div>

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

                            <div class="form-controls filters-controls">
                                <button id="applyFiltersBtn" class="btn submit-btn" type="button">Apply</button>
                                <a id="clearFiltersBtn" class="clear-all-btn" href="<?= e($clearAllURL) ?>">
                                    <span>Clear all</span>
                                </a>
                            </div>
                        </div>

                        <div class="list-header">
                            <div class="counters">
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
                    </div>

                    <div class="list-container"></div>
                    <div class="list-footer"></div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(ICONS_PATH . "ModeSelector.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>