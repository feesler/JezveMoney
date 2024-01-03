<?php include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <main>
                        <header class="heading">
                            <h1><?= __("about.title") ?></h1>
                        </header>
                        <section id="contentContainer" class="content-container">
                            <div class="app-info"><?= __("appName") ?>, 2012-<?= e($year) ?></div>
                            <div class="app-info"><?= __("about.version") ?>: <?= e($version) ?></div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>


<svg width="0" height="0" display="none" xmlns="http://www.w3.org/2000/svg">
    <symbol id="logo_u" viewBox="0 0 100 100">
        <path d="m18 27.4v45.6l46 7.2v-39l-14.1 4.64-7.06 2.74 5.48 14v.86l-4.18 4.57h-14.8l-4.18-4.57v-.86l6.96-17.7v-.856l-1.16-3.14h-.868v-.856h13.3v.856h-.868l-1.16 3.14v.856l.864 2.2 7.06-2.74 14.7-6.54-.004-17.5zm55.6 9.42-4.22 2.04c.394-.0366.796-.0546 1.2-.0546 7.12 0 12.9 5.8 12.9 12.9s-5.78 12.9-12.9 12.9c-1.62 0-3.18-.298-4.6-.84v2.42c1.45.458 3 .708 4.6.708 8.4 0 15.2-6.8 15.2-15.2 0-7.36-5.22-13.5-12.2-14.9zm-3.02 2.96c-1.63 0-3.2.385-4.6.979v21.8c1.41.592 2.98.918 4.6.918 6.56 0 11.9-5.3 11.9-11.9s-5.3-11.8-11.9-11.8zm1.04 4.46.39.258c-.0706 1.05-.105 1.84-.105 2.34v8.66c-6e-6.76.0852 1.23.262 1.43.177.199.654.344 1.46.414l-.105.704c-.962-.0706-1.94-.102-2.92-.102-.618 0-1.48.0304-2.58.102l-.0782-.726c.724 0 1.21-.125 1.46-.364.242-.238.364-.724.364-1.46v-7.76c0-.918-.226-1.38-.676-1.38-.0618 0-.298.093-.73.234l-.234-.624c.962-.388 2.14-.974 3.48-1.74z" />
    </symbol>
</svg>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>