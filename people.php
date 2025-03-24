<?php

 function peopleEntry($name,$title,$cini,$tel,$mail,$mail2,$web,$pic){
    ?>
    <table border="0" cellpadding=15 id="table1">
     <tr>
	<td align=center width=140><image height=140 src="./images/pictures/<?print($pic);?>"></td>
	<td style="font-family: arial">
	  <p style="font-weight: bold"><?print($name.", ".$title);?></p>
	  <p>Dipartimento di Ingegneria Elettrica e delle Tecnologie dell'Informazione (DIETI)
	   <? if($cini){ ?>,<br>Consorzio Interuniversitario Nazionale per l'Informatica (ITeM Lab)<? } ?>
	  </p>
	  <p>Via Claudio, 21 - 80125 - Napoli</p>
	  <p><i>Tel</i>: <?print($tel);?> - <i>Fax</i>: +39 081 768-3816</p>
	  <p><i>Email</i>: <a href="mailto:<?print($mail);?>"><?print($mail);?></a>
	   <? if($mail2){ ?>and <a href="mailto:<?print($mail2);?>"><?print($mail2);?></a><? } ?>
	  </p>
	  <p><i>HomePage</i>: <a href="<?print($web);?>"><?print($web);?></a></p>
	</td>
     </tr>
    </table>
    <hr>
    <?
 }
 
 function peopleEntryAlumni($name,$title,$web,$pic){
    ?>
    <table border="0" cellpadding=15 id="table1">
     <tr>
	<td align=center width=140><image height=140 src="./images/pictures/<?print($pic);?>"></td>
	<td style="font-family: arial">
	  <p style="font-weight: bold"><?print($name.", ".$title);?></p>
	  <p><i>HomePage</i>: <a href="<?print($web);?>"><?print($web);?></a></p>
	</td>
     </tr>
    </table>
    <hr>
    <?
 }

  $path = "";
 $page="People";
 include("page.php");

?>

<div class=textArea>
 <p><big><center><b>Members of our research group</b></center></big></p>
 <?
   peopleEntry("Antonio Pescape'", "PhD, Full Professor (Principal Investigator)", false, "+39 081 7683856",
	       "pescape[at]unina.it", "", "http://wpage.unina.it/pescape", "antonio2.jpg");
   peopleEntry("Alessio Botta", "PhD", true, "+39 081 7683865",
	       "a.botta[at]unina.it", "alessio.botta[at]consorzio-cini.it", "http://wpage.unina.it/a.botta", "alessio.jpg");
   peopleEntry("Walter de Donato", "PhD", true, "+39 081 7683821",
	       "walter.dedonato[at]unina.it", "", "http://wpage.unina.it/walter.dedonato", "walter.png");
   peopleEntry("Giuseppe Aceto", "PhD", true, "+39 081 7683821",
	       "giuseppe.aceto[at]unina.it", "", "http://wpage.unina.it/giuseppe.aceto", "giuseppe.jpg");
   peopleEntry("Valerio Persico", "PhD", false, "+39 081 7683821",
               "valerio.persico[at]unina.it", "", "http://wpage.unina.it/valerio.persico", "valerio.jpg");
   peopleEntry("Antonio Montieri", "PhD Student", false, "+39 081 7683821",
               "antonio.montieri[at]unina.it", "", "http://wpage.unina.it/antonio.montieri", "toni_montieri.jpg");
   peopleEntry("Domenico Ciuonzo", "PhD", false, "+39 081 7683821",
               "domenico.ciuonzo[at]ieee.org", "", "https://domenicociuonzo.wordpress.com", "ciuonzo.jpg");
//   peopleEntry("Giorgio Ventre", "Full Professor", false, 3908,
//	       "giorgio[at]unina.it", "", "http://www.grid.unina.it/individual/ventre/ventre.html", "giorgio.jpg");
 ?>
<p>&nbsp;</p>
 <p><big><center><b>Alumni</b></center></big></p>
 <?
//   peopleEntry("Alberto Dainotti", "PhD", false, "-",
//	       "", "", "http://wpage.unina.it/alberto", "alberto.jpg");
//   peopleEntry("Pietro Marchetta", "PhD", false, "-",
//	       "", "", "http://wpage.unina.it/pietro.marchetta", "pietro.jpg");
   peopleEntryAlumni("Alberto Dainotti", "PhD","http://wpage.unina.it/alberto", "alberto.jpg");
   peopleEntryAlumni("Pietro Marchetta", "PhD","http://wpage.unina.it/pietro.marchetta", "pietro.jpg");
 ?>

 <? collaborate(); ?>
 <br>
</div>

<? footer(); ?>
