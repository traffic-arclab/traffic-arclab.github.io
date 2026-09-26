function Scelto(parm){

	newparm=parm;
	if (newparm==1) {
		top.SI.document.SIForm1.NumUt.style.backgroundColor="#FFFFFF";
		top.SI.document.SIForm1.ET.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.NL.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.ET.value="";
		top.SI.document.SIForm1.NL.value="";
		top.SS.location="scelte secondarie NU.htm";
	}
	if (newparm==2){
		top.SI.document.SIForm1.NumUt.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.ET.style.backgroundColor="#FFFFFF";
		top.SI.document.SIForm1.NL.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.NumUt.value="";
		top.SI.document.SIForm1.NL.value="";
		top.SS.location="scelte secondarie TT.htm";
	}
	if (newparm==3){
		top.SI.document.SIForm1.NumUt.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.ET.style.backgroundColor="buttonface";
		top.SI.document.SIForm1.NL.style.backgroundColor="#FFFFFF";
		top.SI.document.SIForm1.NumUt.value="";
		top.SI.document.SIForm1.ET.value="";
		top.SS.location="scelte secondarie NL.htm";
	}
}

function aggiornamento(){
	
	top.Engine.Calcolo_Valori();
}