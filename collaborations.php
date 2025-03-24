<?php
function collabEntry($name,$org,$topic,$link){
   global $path;

   ?>
   <li>
    <a href="<?=$link?>"><?=$name?></a>
    (<?=$org?>):
    <i><?=$topic?></i>
   </li>
   <?
}

  $path = "";
  $page = "Collaborations";
  include("page.php");
?>

<div class=textArea>
  <p><b><center><big>Research Collaborations</big></center></b></p>

  <hr>

  <p><b>Current</b></p>
  <ul>
<?
  collabEntry("Dario Rossi","TELECOM ParisTech (formerly known as ENST), France","Impact of sampling on traffic monitoring and analysis, Traffic Classification","http://perso.infres.enst.fr/~drossi/");
  collabEntry("KC Claffy","Cooperative Association for Internet Data Analysis (CAIDA), San Diego","Traffic Classification","http://www.caida.org/home/seniorstaff/kclaffy.xml");
  collabEntry("Ernst Biersack","Eur&eacute;com 06904 Sophia Antipolis, France","Passive analysis of 3G/4G networks","http://www.eurecom.fr/~btroup/erbi_page.html");
  collabEntry("Benoit Donnet","Universit&egrave; Catholique de Louvain, Belgium","Topology Discovery","http://inl.info.ucl.ac.be/donnet");
  collabEntry("Nick Feamster","Princeton University","Network Neutrality and Broadband Performance Evaluation","http://www.cs.princeton.edu/~feamster/");
  collabEntry("Cedric Westphal","DoCoMo USA Labs - Palo Alto (USA)","Compression of monitoring data","http://www.docomolabsresearchers-usa.com/~cwestphal/");
  collabEntry("Fabio Ricciato","University of Ljubljana","Traffic monitoring and analysis","http://www.fri.uni-lj.si/en/fabio-ricciato/");
  collabEntry("Pascal Merindol","University of Strasburgo","Network topologies","http://clarinet.u-strasbg.fr/~merindol/");
  collabEntry("Mahesh K. Marina","University of Edinburgh","Broadband Performance Monitoring","http://homepages.inf.ed.ac.uk/mmarina/");
  collabEntry("Ethan Katz-Bassett","University of Southern California","Internet Measurement","http://www-bcf.usc.edu/~katzbass/");
  collabEntry("Renato Lo Cigno","University of Trento","Inter-Vehicular Communications","http://disi.unitn.it/locigno/");
  //collabEntry("","","","");
?>
  </ul>

  <hr>

  <p><b>Past</b></p>

  <ul>
<?
  collabEntry("Rajiv Chakravorty","Systems Research Group, University of Cambridge Computer Laboratory","Performance evaluation of GPRS networks","http://www.cl.cam.ac.uk/~rc277/");
  collabEntry("Roger Karrer","Network Group of the Deutsche Telekom Laboratories in Berlin, Germany","Analysis and performance evaluation of Magnets WiFi Backbone","http://www.deutsche-telekom-laboratories.de/~karrer/");
  collabEntry("Prasad Calyam","The Ohio State University and The Ohio Supercomputer Center","Mutimedia Traffic Characterization and Modeling","http://www.ece.osu.edu/~calyama/");
  //collabEntry("","","","");
?>
  </ul>

  <hr>

  <? collaborate(); ?>
  <br>
</div>

<? footer(); ?>
