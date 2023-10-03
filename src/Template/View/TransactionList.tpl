<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page transaction-view">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap list-view__content">
                    <main>
                        <header id="heading" class="heading">
                            <h1><?= __("transactions.listTitle") ?></h1>
                            <div class="heading-actions"></div>
                        </header>

                        <header id="contentHeader" class="content-header">
                            <aside id="filtersContainer" class="filters-container">
                                <header class="filters-heading">
                                    <span class="filters-heading__title"><?= __("filters.title") ?></span>
                                </header>

                                <hr class="filters-separator">

                                <div class="filters-list">
                                    <div class="filters-row">
                                        <section id="typeFilter" class="filter-item trans-type-filter">
                                            <header class="filter-item__title"><?= __("filters.transactionType") ?></header>
                                        </section>

                                        <hr class="filters-separator">

                                        <section id="accountsFilter" class="filter-item">
                                            <header class="filter-item__title"><?= __("filters.accountsPersonsAndCategories") ?></header>
                                            <select id="acc_id" name="acc_id" multiple></select>
                                        </section>
                                    </div>

                                    <hr class="filters-separator">

                                    <div class="filters-row">
                                        <section id="dateFilter" class="filter-item date-range-filter validation-block"></section>

                                        <hr class="filters-separator">

                                        <section id="amountFilter" class="filter-item amount-range-filter validation-block"></section>

                                        <hr class="filters-separator">

                                        <section id="searchFilter" class="filter-item">
                                            <header class="filter-item__title"><?= __("filters.search") ?></header>
                                        </section>
                                    </div>
                                </div>

                                <hr class="filters-separator">
                            </aside>
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
<?php include(TPL_PATH . "Footer.tpl");    ?>