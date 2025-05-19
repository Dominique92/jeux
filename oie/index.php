<!doctype html>
<html lang="fr">
<head>
	<meta http-equiv="Expires" content="0" />
	<link type="text/css" rel="stylesheet" href="index.css">
</head>

<body>
	<table cellspacing="0">
<?php
		$neuf = [0,1,2,3,4,5,6,7,8];
		foreach ($neuf as $x) {
			echo "\t\t<tr>".PHP_EOL;
			foreach ($neuf as $y) {
				echo "\t\t\t<td class=\"v$x h$y c$x$y\"";
				if (file_exists ("c$x$y.jpg"))
					echo " style=\"background-image: url('c$x$y.jpg')\"";
				echo "></td>".PHP_EOL;
			}
			echo "\t\t</tr>".PHP_EOL;
		}
?>
	</table>

	<h4>PREPARATION</h4>
	<p>Mettre un trésor sur chaque case vide</p>
	<p>Chacun place son pion devant la porte</p>
	<h4>CHACUN SON TOUR</h4>
	<p>Tirer un dé</p>
	<p>Avancer du nombre de cases donné par le dé</p>
	<p>en partant si possible vers le centre (flèches)</p>
	<p>Tourner si on rencontre un mur</p>
	<p>Si on termine sur une case avec un trésor, le prendre</p>
	<p>Si on termine sur la grue, prendre un autre trésor</p>
	<p>Si on termine sur un oie, voler jusqu'à l'autre oie</p>
	<p>Si on termine sur la prison, passer le tour suivant</p>
	<p>Si on termine sur la tête de mort, sortir et recommencer</p>
	<div>&copy; <a href="https://oie.cavailhez.fr">https://oie.cavailhez.fr</a></div>
</body>
</html>
