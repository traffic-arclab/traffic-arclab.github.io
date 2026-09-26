function round(input){
	return (Math.round(input*10000)/10000);
	}

function Erlang_da_Num_Utenti(NU,MDP,BHF) {
	var BHT;
	var Erlang;
	BHT=(NU*MDP*BHF);
	Erlang=(BHT/60);
	return(Erlang);
}

function Erlang_B(Erlang,Numlinee) {
	var Potnum, Fatnum, Num, Den;
	Potnum = Math.pow(Erlang,Numlinee);
	Fatnum = factorial(Numlinee);
	Num = (Potnum/Fatnum);
	Den = Sommatoria(Erlang,Numlinee);
	return(Num/Den);
}

function factorial(Numero) {
	Numero = Math.floor(Numero);
	if (Numero<0) {
		return (window.alert("Numero Errato"))
	}
	if ((Numero == 0) || (Numero == 1)) {
		return (1);
	}
	else return (Numero*factorial(Numero-1));
}

function Sommatoria (Erlang,Max) {
	var somma=0;
	var temp=0;
	for (var icount = 0; icount <= Max; icount++) {
		temp=funzden (Erlang,icount);
		somma += temp;
	}
	return (somma)
}

function funzden (Erlang,icount) {
	var Potnum, Den;
	Potnum=Math.pow(Erlang, icount);
	Den=factorial(icount);
	return(Potnum/Den);
}

function CalcoloCVT(){
	var Prob; 
	var Numlinee;
	var NU=top.SI.document.SIForm1.NumUt.value;
	var ET=top.SI.document.SIForm1.ET.value;
	var NL=top.SI.document.SIForm1.NL.value;
	var Erlang;
	if (NU != "") {
		var MDP=top.SS.document.SSFormNU.NMT.value;
		var BHF=top.SS.document.SSFormNU.BHF.value;
		var Blocco=top.SS.document.SSFormNU.BP.value;
		Erlang = Erlang_da_Num_Utenti(NU,MDP,BHF);
		Prob = 1;
		Numlinee = 1;
		while ((Prob > Blocco) && (Numlinee <= NU)) {
			Prob=Erlang_B(Erlang,Numlinee);
			Numlinee++
		}
		return (Numlinee-1);
	}
	if (ET != "") {
		Prob = 1;
		Numlinee = 1;
		var Blocco = top.SS.document.SSFormTT.BP.value;
		while (Prob > Blocco) {
			Prob=Erlang_B(ET,Numlinee);
			Numlinee++;
		}
		return (Numlinee-1);
	}
	if (NL != "") {
		return (NL)			
	}
	else return (0);
}

function CambioCodec(){
	with (document.FrontPage_Form1)
  {
    with (Delay)
    {
      if ((CO.selectedIndex==0)||(CO.selectedIndex==1)||(CO.selectedIndex==4)
      ||(CO.selectedIndex==5)||(CO.selectIndex==6)||(CO.selectIndex==7))
      {
        length=9;
        options[0].text="10 milliseconds (80 samples)";
        options[1].text="20 milliseconds (160 samples)";
        options[2].text="30 milliseconds (240 samples)";
        options[3].text="40 milliseconds (320 samples)";
        options[4].text="50 milliseconds (400 samples)";
        options[5].text="60 milliseconds (480 samples)";
        options[6].text="70 milliseconds (560 samples)";
        options[7].text="80 milliseconds (640 samples)";
        options[8].text="90 milliseconds (720 samples)";
		options[0].value="10";
		options[1].value="20";
		options[2].value="30";
		options[3].value="40";
		options[4].value="50";
		options[5].value="60";
		options[6].value="70";
		options[7].value="80";
		options[8].value="90";
        selectedIndex=1;
      }
      if ((CO.selectedIndex==2) || (CO.selectedIndex==3))
      {
        length=3;
        options[0].text="30 milliseconds (1 sample)";
        options[1].text="60 milliseconds (2 sample)";
        options[2].text="90 milliseconds (3 sample)";
        options[0].value="30";
		options[1].value="60";
		options[2].value="90";
        selectedIndex=0;
      }
      if (CO.selectedIndex==8)
      {
        length=9;
        options[0].text="10 milliseconds (16 samples)";
        options[1].text="20 milliseconds (32 samples)";
        options[2].text="30 milliseconds (48 samples)";
        options[3].text="40 milliseconds (64 samples)";
        options[4].text="50 milliseconds (80 samples)";
        options[5].text="60 milliseconds (96 samples)";
        options[6].text="70 milliseconds (112 samples)";
        options[7].text="80 milliseconds (128 samples)";
        options[8].text="90 milliseconds (144 samples)";
		options[0].value="10";
		options[1].value="20";
		options[2].value="30";
		options[3].value="40";
		options[4].value="50";
		options[5].value="60";
		options[6].value="70";
		options[7].value="80";
		options[8].value="90";
        selectedIndex=1;
      }
      if ((CO.selectedIndex >= 9)&&(CO.selectedIndex <= 11))
      {
        length=9;
        options[0].text="10 milliseconds (1 sample)";
        options[1].text="20 milliseconds (2 samples)";
        options[2].text="30 milliseconds (3 samples)";
        options[3].text="40 milliseconds (4 samples)";
        options[4].text="50 milliseconds (5 samples)";
        options[5].text="60 milliseconds (6 samples)";
        options[6].text="70 milliseconds (7 samples)";
        options[7].text="80 milliseconds (8 samples)";
        options[8].text="90 milliseconds (9 samples)";
		options[0].value="10";
		options[1].value="20";
		options[2].value="30";
		options[3].value="40";
		options[4].value="50";
		options[5].value="60";
		options[6].value="70";
		options[7].value="80";
		options[8].value="90";
        selectedIndex=1;
      }
        if ((CO.selectedIndex==12) || (CO.selectedIndex==13))
      {
        length=4;
        options[0].text="20 milliseconds (1 sample)";
        options[1].text="40 milliseconds (2 samples)";
        options[2].text="60 milliseconds (3 samples)";
        options[3].text="80 milliseconds (4 samples)";
        options[0].value="20";
		options[1].value="40";
		options[2].value="60";
        options[3].value="80";
        selectedIndex=0;
      }  
    }
  }
}

function Compression(){
	var Compression;
		with (document.FrontPage_Form1.CO){
			if (selectedIndex==0){Compression=64};
			if ((selectedIndex==1)||(selectedIndex==5)){Compression=32};
			if (selectedIndex==4){Compression=40};
			if (selectedIndex==6){Compression=24};
			if ((selectedIndex==7)||(selectedIndex==8)){Compression=16};
			if (selectedIndex==3){Compression=5.3};
			if (selectedIndex==2){Compression=6.3};
			if ((selectedIndex==9)||(selectedIndex==10)){Compression=8};
			if (selectedIndex==11){Compression=11.8};
			if (selectedIndex==12){Compression=5.6};
			if (selectedIndex==13){Compression=12.2};
		}
		return(Compression);
}

function Cambio_protocol (){
	with (document.FrontPage_Form1){
		with (PROTO2){
			if ((PROT.selectedIndex==0)||(PROT.selectedIndex==3)){
				lenght=6;
				options[0].text="ATM-AAL1";
				options[1].text="ATM-AAL2";
				options[2].text="ATM-AAL5";
				options[3].text="Frame Relay";
				options[4].text="PPP";
				options[5].text="802.3 (Ethernet)";
				options[0].value="ATM-AAL1";
				options[1].value="ATM-AAL2";
				options[2].value="ATM-AAL5";
				options[3].value="Frame Relay";
				options[4].value="PPP";
				options[5].value="802.3 (Ethernet)";
			}
			if ((PROT.selectedIndex==1)||(PROT.selectedIndex==2)){
				lenght=2;
				options[0].text="PPP";
				options[0].value="PPP";
				options[1].text="";
				options[1].value="";
				options[2].text="";
				options[2].value="";
				options[3].text="";
				options[3].value="";
				options[4].text="";
				options[4].value="";
				options[5].text="";
				options[5].value="";
			}
		}
	}
}

function Bandwidth_Layer7 (NC,BPC){
	return (NC*BPC);  
}
	
function Factor_Layer6(Codec,BPC){
	return (Codec/BPC);
}
	
function Bandwidth_Layer6 (MUL,BW7){
	return (MUL*BW7);
}

function Bandwidth_Layer6_VAD (VAD,LB6){
	return (VAD*LB6);
}
	
function Payload543(CO,Packet,VAD){
	return Math.ceil(CO/8*Packet*VAD);
}
	
function Factor_Layer543 (Prot,Pld543){
	return (Prot/Pld543)+1;
}

function Bandwidth_Layer543_1 (BW6,MUL5){
	return BW6*MUL5;
}

function Bandwidth_Layer543_2 (CON,BW543){
	return BW543*CON;
}
	
function Factor_Layer2 (PLD543,Prot2,Prot3){
	payload2 = PLD543 + Prot3
	switch (Prot2){	
		case "ATM-AAL1":
			if (payload2 < 46) {
				pad = 46 - payload2;
			}
			else {
				pad = 0;
			}
			M2 = 53/(46-pad);
			break
		case "ATM-AAL2":
			if (payload2 < 44) {
				pad = 44 - payload2;
			}
			else {
				pad = 0;
			}
			M2 = 53/(44-pad);
			break
		case "ATM-AAL5":
			if (payload2 < 47) {
				pad = 47 - payload2;
			}
			else {
				pad = 0;
			}
			M2 = 53/(47-pad);
	    		break
		case "Frame Relay":
			M2 = 1 + 7/payload2;
			break
		case "PPP":
			M2 = 1 + 6/payload2;
			break
		case "802.3 (Ethernet)":
			if (payload2 < 46) {
				pad = 46 - payload2;
			}
			else {
				pad = 0;
			}
			M2 = 1 + (26+pad)/payload2;
	}		
	return (M2);
}
	
function Bandwidth_Layer2 (M2,B543){
	return  (B543*M2);
}
	
function Efficiency (BW7,BW2){
	return ((BW7/BW2)*100);
}

function Calcolo_Valori(){
	with (top.Engine.document.FrontPage_Form1) {
		CVT.value=CalcoloCVT();
		BW7.value=round(Bandwidth_Layer7(CVT.value,MUL7.value));
		MUL6a.value=round(Factor_Layer6(Compression(),MUL7.value));
		BW6a.value=round(Bandwidth_Layer6(MUL6a.value,BW7.value));
		MUL6b.value=VAD.value;
		BW6b.value=round(Bandwidth_Layer6_VAD(MUL6b.value,BW6a.value));
		HBpp.value=PROT.value;
		DBpp.value=Payload543(Compression(),Delay.value,VAD.value);
		MUL543a.value=round(Factor_Layer543(PROT.value,DBpp.value));
		BW543a.value=round(Bandwidth_Layer543_1(MUL543a.value,BW6b.value));
		MUL543b.value=CONTROLLO.value;
		BW543b.value=round(Bandwidth_Layer543_2(MUL543b.value,BW543a.value));
		MUL2.value=round(Factor_Layer2(DBpp.value,PROTO2.value,PROT.value));
		BW2.value=round(Bandwidth_Layer2(MUL2.value,BW543b.value));
	}
}

function Nuova_Finestra(){
	var W;
	with (document.FrontPage_Form1){
		if (PROTO2.value=="PPP"){
			W=window.open("PPP.html", "PPP", "width=500, height=250, status=no, resizable=no");
		}
		if (PROTO2.value=="802.3 (Ethernet)"){
			W=window.open("Ethernet.html", "Ethernet", "width=500, height=250, status=no, resizable=no");
		}
	}
}
			
function Open_Window_Test(){
	var codec_number;
	var quality_window;
	var filename;
	var codec_name;
	
	codec_number = document.FrontPage_Form1.CO.selectedIndex + 1;
	
	//per includere nuovi formati wave, è sufficiente sostituire il nome del file,
	//che deve comunque trovarsi nella stessa directory "Samples"!!!
	
	switch (codec_number)
	{
	case 1 : codec_name = "G.711 PCM 64K"; filename = "Samples/g711-64Kbps.wav"; break;
	case 2 : codec_name = "G.721 ADPCM 32K"; filename = "Samples/g721-32kbps.wav"; break;
	case 3 : codec_name = "G.723.1 MQ-CLP 6.3K"; filename = "Samples/gsm.wav"; break;
	case 4 : codec_name = "G.723.1 ACELP 5.3K"; filename = "Samples/gsm.wav"; break;
	case 5 : codec_name = "G.726 ADPCM 40K"; filename = "Samples/g726-40kbps.wav"; break;
	case 6 : codec_name = "G.726 ADPCM 32K"; filename = "Samples/g726-32kbps.wav"; break;
	case 7 : codec_name = "G.726 ADPCM 24K"; filename = "Samples/g726-24kbps.wav"; break;
	case 8 : codec_name = "G.726 ADPCM 16K"; filename = "Samples/g726-16kbps.wav"; break;
	case 9 : codec_name = "G.728 Id-CELP 16K"; filename = "Samples/gsm.wav"; break;
	case 10 : codec_name = "G.729 CS-ACELP 8K"; filename = "Samples/gsm.wav"; break;
	case 11 : codec_name = "G.729A CS-ACELP 8K"; filename = "Samples/gsm.wav"; break;
	case 12 : codec_name = "G729E CS-ACELP 11.8K"; filename = "Samples/gsm.wav"; break;
	case 13 : codec_name = "GSM 6.10 (HR)"; filename = "Samples/gsm.wav"; break;
	case 14 : codec_name = "GSM 6.10 (EFR)"; filename = "Samples/gsm-12kbps.wav"; break;
	default : codec_name = "ERROR CHOOSING CODEC"; filename = "Samples/gsm.wav"; break;
	};
	
	quality_window = window.open('','Codec_Quality_Test','left=0,top=0,width=350,height=350,directories=0,location=0,menubar=0,toolbar=0,status=0,scrollbars=0,resizable=1');
	quality_window.focus();
	
 	quality_window.document.writeln("<html>");
	quality_window.document.writeln("<head>");
	quality_window.document.writeln("	<title>Codec Quality Test</title>");
	quality_window.document.writeln("</head>");

	quality_window.document.writeln("<body background=\"fed_back1.gif\">");
	quality_window.document.writeln("<embed src=\""+filename+"\" hidden=true autostart=true loop=true height=\"5\" width=\"5\"><noembed>Your browser doesn't support this plug in !!!</noembed>");
	//quality_window.document.writeln("<bgsound src=\""+filename+"\" loop=\"0\"></bgsound>");
	
	quality_window.document.writeln("<center>");
	quality_window.document.writeln("<font size=\"+1\">TEST QUALITY SAMPLE</font>");
	quality_window.document.writeln("<\center>");
	
	quality_window.document.writeln("<p></p>");
	quality_window.document.writeln("<table align=\"center\" border=\"0\">");
	quality_window.document.writeln("	<tr>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			<b>Selected Codec:</b>");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("		<td width=\"5%\"></td>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln(codec_name);
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("	</tr>");
	quality_window.document.writeln("	<tr>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			<b>Test File:</b>");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("		<td width=\"5%\"></td>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln(filename.slice(8));
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("	</tr>");
	quality_window.document.writeln("	<tr>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			<b>File size:</b>");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("		<td width=\"5%\"></td>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			468KB");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("	</tr>");
	quality_window.document.writeln("	<tr>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			<b>Audio length:</b>");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("		<td width=\"5%\"></td>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			1:00 min");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("	</tr>");
	quality_window.document.writeln("	<tr>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			<b>File type:</b>");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("		<td width=\"5%\"></td>");
	quality_window.document.writeln("		<td>");
	quality_window.document.writeln("			Wave mono, 8 KHz, 8 bit");
	quality_window.document.writeln("		</td>");
	quality_window.document.writeln("	</tr>");
	quality_window.document.writeln("</table>");
	quality_window.document.writeln("<p>");

	if ( filename == "Samples/gsm.wav")
	{
		quality_window.document.writeln("Sorry, for this codec isn\'t provided a test file.<br>");
		quality_window.document.writeln("We are still working on it!!!");
	}
	
	quality_window.document.writeln("</body>");
	quality_window.document.writeln("</html>");

}