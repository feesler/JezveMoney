<?php
	require_once("./system/setup.php");

	checkUser();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);
	$pers = new Person($user_id);

	$currArr = Currency::getArray(TRUE);

	$tilesArr = $acc->getTilesArray();
	$totalsArr = $acc->getTotalsArray();
	foreach($totalsArr as $curr_id => $balance)
	{
		$balfmt = Currency::format($balance, $curr_id);
		$currName = Currency::getName($curr_id);

		$totalsArr[$curr_id] = array("bal" => $balance, "balfmt" => $balfmt, "name" => $currName);
	}

	// Prepare data of transaction list items
	$tr_count = 5;
	$latestArr = $trans->getArray(0, 0, TRUE, $tr_count);
	$trListData = array();
	foreach($latestArr as $trans)
	{
		$trans_id = $trans[0];
		$src_id = $trans[1];
		$dest_id = $trans[2];
		$fSrcAmount = $trans[3];
		$fDestAmount = $trans[4];
		$cur_trans_type = $trans[5];
		$fdate = $trans[6];
		$comment = $trans[7];

		if ($details)
		{
			$src_balance = $trans[9];
			$dest_balance = $trans[10];
		}

		if ($cur_trans_type == 4)
		{
			$src_owner_id = $acc->getOwner($src_id);
			$dest_owner_id = $acc->getOwner($dest_id);
		}

		$itemData = array("id" => $trans_id);

		// Build accounts string
		$accStr = "";
		if ($src_id != 0)
		{
			if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
				$accStr .= $acc->getName($src_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($src_id);
		}

		if ($src_id != 0 && $dest_id != 0 && ($cur_trans_type == 3 || $cur_trans_type == 4))
			$accStr .= " → ";

		if ($dest_id != 0)
		{
			if ($cur_trans_type == 2 || $cur_trans_type == 3)		// income or transfer
				$accStr .= $acc->getName($dest_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($dest_id);
		}

		$itemData["acc"] = $accStr;

		// Build amount string
		$amStr = $fSrcAmount;
		if ($fSrcAmount != $fDestAmount)
			$amStr .= " (".$fDestAmount.")";
		$itemData["amount"] = $amStr;

		$itemData["date"] = $fdate;
		$itemData["comm"] = $comment;

		if ($details)
		{
			$itemData["balance"] = array();

			if ($cur_trans_type == 1 || $cur_trans_type == 2)
			{
				$tr_acc_id = ($cur_trans_type == 1) ? $src_id : $dest_id;

				$balance = ($cur_trans_type == 1) ? $src_balance : $dest_balance;
				$acc_curr = $acc->getCurrency($tr_acc_id);

				$itemData["balance"][] = Currency::format($balance, $acc_curr);
			}
			else if ($cur_trans_type == 3 || $cur_trans_type == 4)
			{
				if ($src_id != 0)
				{
					$acc_curr = $acc->getCurrency($src_id);

					$itemData["balance"][] = Currency::format($src_balance, $acc_curr);
				}

				if ($dest_id != 0)
				{
					$acc_curr = $acc->getCurrency($dest_id);

					$itemData["balance"][] = Currency::format($dest_balance, $acc_curr);
				}
			}
		}


		$trListData[] = $itemData;
	}

	$persArr = $pers->getArray();
	foreach($persArr as $ind => $pData)
	{
		$noDebts = TRUE;
		$pBalance = array();
		if (isset($pData[2]) && is_array($pData[2]))
		{
			foreach($pData[2] as $pAcc)
			{
				if ($pAcc[2] != 0.0)
				{
					$noDebts = FALSE;
					$pBalance[] = Currency::format($pAcc[2], $pAcc[1]);
				}
			}
		}

		$persArr[$ind]["nodebts"] = $noDebts;
		$persArr[$ind]["balfmt"] = $pBalance;
	}


	$byCurrency = TRUE;
	$curr_acc_id = Currency::getIdByPos(0);
	if (!$curr_acc_id)
		fail();
	$trans_type = 1;		// expense
	$groupType_id = 2;		// group by week

	$statArr = getStatArray($user_id, $byCurrency, $curr_acc_id, $trans_type, $groupType_id, 5);

	$titleString = "Jezve Money";

	$cssArr = array("common.css", "iconlink.css", "tiles.css", "trlist.css", "statistics.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "ready.js", "main.js", "raphael.min.js", "statistics.js");

	include("./templates/index.tpl");
?>