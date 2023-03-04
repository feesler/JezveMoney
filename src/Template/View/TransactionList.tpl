<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page transaction-view-view">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("TRANSACTIONS") ?></h1>
                            <div class="heading-actions"></div>
                        </header>

                        <header id="contentHeader" class="content-header">
                            <aside id="filtersContainer" class="filters-container">
                                <header class="filters-heading">
                                    <span class="filters-heading__title"><?= __("FILTERS") ?></span>
                                </header>

                                <hr class="filters-separator">

                                <div class="filters-list">
                                    <div class="filters-row">
                                        <section id="typeFilter" class="filter-item trans-type-filter">
                                            <header class="filter-item__title"><?= __("FILTER_TYPE") ?></header>
                                        </section>

                                        <hr class="filters-separator">

                                        <section id="accountsFilter" class="filter-item">
                                            <header class="filter-item__title"><?= __("FILTER_ACCOUNTS_PERSONS") ?></header>
                                            <select id="acc_id" name="acc_id" multiple></select>
                                        </section>

                                        <hr class="filters-separator">

                                        <section id="categoriesFilter" class="filter-item">
                                            <header class="filter-item__title"><?= __("FILTER_CATEGORIES") ?></header>
                                            <select id="category_id" name="category_id" multiple></select>
                                        </section>
                                    </div>

                                    <hr class="filters-separator">

                                    <div class="filters-row">
                                        <section id="dateFilter" class="filter-item date-range-filter validation-block">
                                            <header class="filter-item__title"><?= __("FILTER_DATE_RANGE") ?></header>
                                        </section>

                                        <hr class="filters-separator">

                                        <section id="searchFilter" class="filter-item">
                                            <header class="filter-item__title"><?= __("FILTER_SEARCH") ?></header>
                                        </section>
                                    </div>
                                </div>

                                <div class="form-controls filters-controls">
                                    <button id="applyFiltersBtn" class="btn submit-btn" type="button"><?= __("APPLY") ?></button>
                                    <a id="clearFiltersBtn" class="clear-all-btn" href="<?= e($clearAllURL) ?>">
                                        <span><?= __("CLEAR_ALL") ?></span>
                                    </a>
                                </div>
                            </aside>

                            <header class="list-header">
                                <div class="counters">
                                    <div id="itemsCounter" class="counter">
                                        <span class="counter__title"><?= __("LIST_ITEMS") ?></span>
                                        <span id="itemsCount" class="counter__value"></span>
                                    </div>
                                    <div id="selectedCounter" class="counter" hidden>
                                        <span class="counter__title"><?= __("LIST_SELECTED") ?></span>
                                        <span id="selItemsCount" class="counter__value"></span>
                                    </div>
                                </div>
                            </header>
                        </header>

                        <section class="list-container"></section>
                        <footer class="list-footer"></footer>
                    </main>

                    <aside id="itemInfo" class="item-details" hidden></aside>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(ICONS_PATH . "ModeSelector.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>