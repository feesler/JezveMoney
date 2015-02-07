<?php

class MainController extends Controller
{
	public function index()
	{
		global $u, $user_name, $user_id;

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
			if ($trans->type == DEBT)
			{
				$src_owner_id = $acc->getOwner($trans->src_id);
				$dest_owner_id = $acc->getOwner($trans->dest_id);
			}

			$itemData = array("id" => $trans->id);

			// Build accounts string
			$accStr = "";
			if ($trans->src_id != 0)
			{
				if ($trans->type == EXPENSE || $trans->type == TRANSFER)
					$accStr .= $acc->getName($trans->src_id);
				else if ($trans->type == DEBT)
					$accStr .= $acc->getNameOrPerson($trans->src_id);
			}

			if ($trans->src_id != 0 && $trans->dest_id != 0 && ($trans->type == TRANSFER || $trans->type == DEBT))
				$accStr .= " → ";

			if ($trans->dest_id != 0)
			{
				if ($trans->type == INCOME || $trans->type == TRANSFER)
					$accStr .= $acc->getName($trans->dest_id);
				else if ($trans->type == DEBT)
					$accStr .= $acc->getNameOrPerson($trans->dest_id);
			}

			$itemData["acc"] = $accStr;

			// Build amount string
			$amStr = $trans->fsrcAmount;
			if ($trans->fsrcAmount != $trans->fdestAmount)
				$amStr .= " (".$trans->fdestAmount.")";
			$itemData["amount"] = $amStr;

			$itemData["date"] = $trans->date;
			$itemData["comm"] = $trans->comment;

			if ($details)
			{
				$itemData["balance"] = array();

				if ($trans->type == EXPENSE || $trans->type == INCOME)
				{
					$tr_acc_id = ($trans->type == EXPENSE) ? $trans->src_id : $trans->dest_id;

					$balance = ($trans->type == EXPENSE) ? $trans->src_balance : $trans->dest_balance;
					$acc_curr = $acc->getCurrency($tr_acc_id);

					$itemData["balance"][] = Currency::format($balance, $acc_curr);
				}
				else if ($trans->type == TRANSFER || $trans->type == DEBT)
				{
					if ($trans->src_id != 0)
					{
						$acc_curr = $acc->getCurrency($trans->src_id);

						$itemData["balance"][] = Currency::format($trans->src_balance, $acc_curr);
					}

					if ($trans->dest_id != 0)
					{
						$acc_curr = $acc->getCurrency($trans->dest_id);

						$itemData["balance"][] = Currency::format($trans->dest_balance, $acc_curr);
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

		$cssArr = array("common.css", "iconlink.css", "tiles.css", "trlist.css", "charts.css", "statistics.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "main.js", "raphael.min.js", "charts.js");

		include("./view/templates/main.tpl");
	}
}