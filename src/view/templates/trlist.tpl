<div id="trlist" class="trans-list">
<?php	if (!$accounts) {		?>
    <span>You have no one account. Please create one.</span>
<?php	} else if (!$totalTrCount) {	?>
    <span>You have no one transaction yet.</span>
<?php	} else if (!count($transArr)) {	?>
    <span>No transactions found.</span>
<?php	} else {		?>
<?php	if ($showPaginator == TRUE) {		?>
    <div class="paginator-row">
        <div class="mode-selector">
<?php		if ($showDetails) {		?>
            <a class="mode-selector__item" href="<?=e($linkStr)?>">
                <span class="icon"><?=svgIcon("list")?></span>
                <span>Classic</span>
            </a>
            <b class="mode-selector__item">
                <span class="icon"><?=svgIcon("details")?></span>
                <span>Details</span>
            </b>
<?php		} else {		?>
            <b class="mode-selector__item">
                <span class="icon"><?=svgIcon("list")?></span>
                <span>Classic</span>
            </b>
            <a class="mode-selector__item" href="<?=e($linkStr)?>">
                <span class="icon"><?=svgIcon("details")?></span>
                <span>Details</span>
            </a>
<?php		}	?>
        </div>
<?php	}	?>
<?php	if ($trParams["onPage"] > 0 && $showPaginator == TRUE) {		?>
        <div class="paginator">
<?php		foreach($pagesArr as $pageItem) {
                if (!is_numeric($pageItem["text"])) {   ?>
            <span><?=e($pageItem["text"])?></span>
<?php			} else if ($pageItem["active"]) {   ?>
            <span><b><?=e($pageItem["text"])?></b></span>
<?php			} else {    ?>
            <span><a href="<?=e($pageItem["link"])?>"><?=e($pageItem["text"])?></a></span>
<?php           }
            }	?>
        </div>
<?php	}	?>
    </div>
<?php	if ($showDetails) {	?>
    <table id="tritems" class="trans-list_details">
<?php	} else {	?>
    <div id="tritems">
<?php	}	?>
<?php	foreach($trListData as $trItem) {	?>
<?php	    if ($showDetails) {		?>
        <tbody class="trans-list__item-wrapper">
        <tr data-id="<?=e($trItem["id"])?>">
            <td>
                <div class="ellipsis-cell">
                    <div class="trans-list__item-title" title="<?=e($trItem["acc"])?>">
                        <span><?=e($trItem["acc"])?></span>
                    </div>
                </div>
            </td>
            <td>
                <div class="trans-list__item-content">
                    <span><?=e($trItem["amount"])?></span>
                </div>
            </td>
            <td>
                <div class="tritem_balance">
                    <span><?=implode("</span><span>", array_map("e", $trItem["balance"]))?></span>
                </div>
            </td>
            <td>
                <div class="trans-list__item-details">
                    <span><?=e($trItem["date"])?></span>
                </div>
            </td>
            <td>
                <div class="ellipsis-cell">
<?php           if ($trItem["comment"] != "") {		?>
                    <div title="<?=e($trItem["comment"])?>">
                        <span class="trans-list__item-comment"><?=e($trItem["comment"])?></span>
                    </div>
<?php           } else {		?>
                    <div></div>
<?php           }	?>
                </div>
            </td>
        </tr>
        </tbody>
<?php	    } else {		?>
        <div class="trans-list__item-wrapper">
            <div class="trans-list__item" data-id="<?=e($trItem["id"])?>">
                <div class="trans-list__item-title">
                    <span><?=e($trItem["acc"])?></span>
                </div>
                <div class="trans-list__item-content">
                    <span><?=e($trItem["amount"])?></span>
                </div>
                <div class="trans-list__item-details">
                    <span><?=e($trItem["date"])?></span>
<?php		if ($trItem["comment"] != "") {		?>
                    <span class="trans-list__item-comment"><?=e($trItem["comment"])?></span>
<?php		}	?>
                </div>
            </div>
        </div>
<?php	}	?>
<?php	}	?>
<?php	if ($showDetails) {		?>
    </table>
<?php	} else {	?>
    </div>
<?php	}	?>
<?php	if ($trParams["onPage"] > 0 && $showPaginator == TRUE) {		?>
    <div class="paginator-row">
        <div class="paginator">
<?php       foreach($pagesArr as $pageItem) {
                if (!is_numeric($pageItem["text"])) {   ?>
                                    <span><?=e($pageItem["text"])?></span>
<?php           } else if ($pageItem["active"]) {   ?>
                                    <span><b><?=e($pageItem["text"])?></b></span>
<?php			} else {    ?>
                                    <span><a href="<?=e($pageItem["link"])?>"><?=e($pageItem["text"])?></a></span>
<?php			}
            }	?>
                                </div>
<?php	}	?>
    </div>
<?php	}	?>
</div>
