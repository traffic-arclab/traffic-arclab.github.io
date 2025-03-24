<?php
  $path = "";
  $page = "Software-Defined Network Monitoring";
  include("page.php");
?>

<div class=textArea>
        <h2>Software-Defined Networks Monitoring</h2>

        <h3>Description</h3>

                <p style="padding-left: 1em">
Networks are the more and more common and pervasive in many aspects of our everyday life.
While they allow very easy access to online services and resources, they have become the more and more complex to both build and manage.
Current network architectures are rigid thus it is especially hard to add new features to them.
                </p>
                <p style="padding-left: 1em">
Software Defined Networking (SDN) offers a solution for this problem mainly through the following features:
(i) data and control planes are decoupled;
(ii) control logic is moved out of the network devices (SDN switches) to an external Network Operating System (also called the SDN controller);
(iii) external applications can program the network using the abstraction mechanisms provided by the SDN controller.
                </p>
                <p style="padding-left: 1em">
The SDN concept has quickly gained significant focus by the research community after the introduction of OpenFlow in 2008.
The ongoing adoption and research on SDN has provided new opportunities regarding the network monitoring and measurements.
The newly proposed solutions for network monitoring in SDN environments are based on approaches completely different from the counterparts in traditional networks, and this is mainly due to the abstraction mechanism provided by the Network Operating System (NOS).
                </p>
                <p style="padding-left: 1em">
The new possibilities provided by SDN and its NOS introduce also new issues, limitations, and sources of error, which were previously undiscussed in such manner.
In projects related to SDN Monitoring we research both the new promises offered by SDN, and the new challenges it poses.
                </p>

        <hr>



        <h3>SOMETIME Project</h3>
<p style="padding-left: 1em">
The SOMETIME project (SOftware Defined Network-based Available Bandwidth MEasuremenT In MONROE)
is a "Scientific Excellence" project of the <i>First MONROE Open Call for Experiments and Extensions</i>.
<a href="http://www.monroe-project.eu">MONROE</a> (Measuring Mobile Broadband Networks in Europe) is an European Horizon 2020 project, aimed at building and exercising an European testbed for 5G networks in the form of Experiments-as-a-Service.
</p>
<p style="padding-left: 1em">
In SOMETIME we are investigating the addition of Available Bandwidth (ABw) estimation to the set of metrics collected by MONROE.
We will investigate implementations using active measurements and leveraging the Software Defined Network (SDN) paradigm, both to refine the technique considering interference with node-local processes (a more realistic scenario compared with mutually exclusive measurements), and to mitigate such interference.
</p>

<p style="padding-left: 1em"><a href="sdn/sometime.mp4">Video</a> introducing the SOMETIME project.</p>

<video width="320" height="240" controls>
<source src="sdn/sometime.webm" type="video/webm">
<source src="sdn/sometime.mp4" type="video/mp4">
Your browser does not support the video tag.
</video>

        <hr>



        <h3>Publications</h3>
<p style="padding-left: 1em">
Giuseppe Aceto, Fabio Palumbo, Valerio Persico, Antonio Pescap&egrave;, <b><a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017experimental_evaluation__MandN.pdf">An experimental evaluation of the impact of heterogeneous scenarios and virtualization on the available bandwidth estimation tools</a></b>, IEEE International Workshop on Measurement and Networking (M&amp;N), 2017, Napoli, Italy
<a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017experimental_evaluation__MandN.bib">[bibtex]</a>
<a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017experimental_evaluation__MandN__slides.pdf">[slides]</a>
</p>
						    
	
<p style="padding-left: 1em">
Giuseppe Aceto, Valerio Persico, Antonio Pescap&egrave;, Giorgio Ventre, <b><a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017sometime.pdf">SOMETIME: SOftware defined network-based Available Bandwidth MEasuremenT In MONROE</a></b>
IEEE/IFIP Workshop on Mobile Network Measurement (MNM'17), June 20th, Dublin, Ireland
<a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017sometime.bib">[bibtex]</a>
<a href="http://wpage.unina.it/giuseppe.aceto/pub/aceto2017sometime__slides.pdf">[slides]</a>
</p>



<p style="padding-left: 1em">

	P&eacute;ter Megyesi, Alessio Botta, Giuseppe Aceto, Antonio Pescap&egrave;, S&aacute;ndor Moln&aacute;r &quot;<b><a href="http://wpage.unina.it/giuseppe.aceto/pub/megyesi2016challenges.pdf">Challenges and solution for measuring Available Bandwidth in Software Defined Networks</a></b>&quot;, Computer Communications (2016).
</p>

<p style="padding-left: 1em">

P&eacute;ter Megyesi, Alessio Botta, Giuseppe Aceto, Antonio Pescap&egrave;, S&aacute;ndor Moln&aacute;r &quot;<b><a href="http://wpage.unina.it/giuseppe.aceto/pub/megyesi2016available.pdf">Available Bandwidth Measurement in Software Defined Networks</a></b>&quot; ACM Symposium on Applied Computing (SAC) 2016, April 04 - 08, 2016, Pisa, Italy.
</p>
        
<h3>Datasets</h3>

<p>
Available bandwidth vs. Achievable throughput in MBB networks <a href="https://doi.org/10.5281/zenodo.1300512">DOWNLOAD</a>
</p>

<h3>Tools</h3>
<p>
Modified version of Yaz: <a href="sdn/yaz_modified.tar.gz">DOWNLOAD</a>
</p>


<!--

        <p style="padding-left: 1em">
                <ul>

                <li>
                <a href="http://www.sincrolab.unina.it/mediawiki/index.php/S._Santini">Prof. Sandor Molnar</a>
                (University of Napoli "Federico II", Italy)
                </li>

                </ul>
        </p>
-->

        <p><b>Student Contributors</b></p>
        <p style="padding-left: 1em">
                <ul>
                <li> Antonio Grimaldi</li>
                <li> Daniele Pipolo</li>
                <li> Fabio D'Onofrio</li>
                </ul>
        </p>

        <hr>



        <p style="padding-left: 1em">
        If you are interested in collaborating with us or in opportunities in Traffic,
        please send an e-mail to <a href="mailto:pescape%20[at]%20unina.it">Antonio Pescap&egrave;</a>.
        </p>

        <br>

</div>

<? footer(); ?>



