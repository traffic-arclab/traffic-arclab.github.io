<?php
  $path = "";
  $page = "Home";
  include("page.php");
?>

<div class=textArea>
 <p class="section-title">Welcome to the <i>Traffic</i> web site</p>

 <p>
  <i><b>Traffic</b></i> is a research group working in the area of computer networks and multimedia,
  with focus on <i>Network Monitoring and Measurements</i>. Our research involves measuring and evaluating
  both experimental and operational systems/networks to derive knowledge and models for network behaviors.
  Traffic (and this is the main motivation of its name) focuses on monitoring Internet traffic to provide
  input for developing new algorithms, protocols, and systems for the current and future Internet, with a
  specific focus on network management and security.
 </p>

 <p>
  Besides teaching activities, it is involved in several national and international research projects.
  Although it is a young group, formed in 2003, it has a significant track record with respect to funding (approx. more than 1.5 Ml euro)
  and publications (e.g. conferences like SIGCOMM, Conext, IMC and journals like JSAC, IEEE Networks, IEEE Communication Magazines, etc). Click on the menu on the left side for links to our main projects, publications and software we have produced.
 </p>

 <p>
  <a href="people.php">We</a> are part of the larger Computer Networks group (<a href="http://www.comics.unina.it/">COMICS</a>)
  at University of Napoli Federico II.
 </p>

 <? releases(); ?>

 <? openings(); ?>
 



 <? collaborate(); ?>

</div>

<? footer(); ?>
