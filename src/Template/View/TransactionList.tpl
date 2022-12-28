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
                    <header id="heading" class="heading">
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
                    </header>

                    <header id="contentHeader" class="content-header">
                        <?= IconButton::render([
                            "id" => "filtersBtn",
                            "classNames" => "filters-btn",
                            "icon" => "filter",
                            "title" => "Filters"
                        ]) ?>

                        <aside id="filtersContainer" class="filters-container">
                            <header class="filters-heading">
                                <span class="filters-heading__title">Filters</span>
                                <button id="closeFiltersBtn" class="btn icon-btn close-btn right-align" type="button">
                                    <svg class="icon close-icon">
                                        <use href="#close"></use>
                                    </svg>
                                </button>
                            </header>

                            <div class="filters-list">
                                <div class="filters-row">
                                    <section class="filter-item trans-type-filter">
                                        <header class="filter-item__title">Type</header>
                                        <?= LinkMenu::render([
                                            "id" => "typeMenu",
                                            "classNames" => "trtype-menu",
                                            "multiple" => true,
                                            "items" => $typeMenu,
                                        ]) ?>
                                    </section>

                                    <section id="accountsFilter" class="filter-item">
                                        <header class="filter-item__title">Accounts and persons</header>
                                        <select id="acc_id" name="acc_id" multiple></select>
                                    </section>

                                    <section id="categoriesFilter" class="filter-item">
                                        <header class="filter-item__title">Categories</header>
                                        <select id="category_id" name="category_id" multiple></select>
                                    </section>
                                </div>

                                <div class="filters-row">
                                    <section id="dateFilter" class="filter-item date-range-filter validation-block">
                                        <header class="filter-item__title">Date range</header>
                                        <?= DateRangeInput::render($dateRange) ?>
                                    </section>

                                    <section id="searchFilter" class="filter-item">
                                        <header class="filter-item__title">Search</header>
                                    </section>
                                </div>
                            </div>

                            <div class="form-controls filters-controls">
                                <button id="applyFiltersBtn" class="btn submit-btn" type="button">Apply</button>
                                <a id="clearFiltersBtn" class="clear-all-btn" href="<?= e($clearAllURL) ?>">
                                    <span>Clear all</span>
                                </a>
                            </div>
                        </aside>

                        <header class="list-header">
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
                        </header>
                    </header>

                    <main class="list-container"></main>
                    <footer class="list-footer"></footer>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(ICONS_PATH . "ModeSelector.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>