// ==UserScript==
// @name         TimeForge Schedule Exporter
// @namespace    ganonscrub_script
// @version      0.1
// @description  Adds a button to export your schedule as a CSV
// @author       ganonscrub
// @include      *timeforge.com/Scheduler/sa/employeeSchedules.html*
// @grant        none
// @updateURL	 https://raw.githubusercontent.com/ganonscrub/TFSchExp/master/TFSchExp.js
// ==/UserScript==

function Event( year, month, date, tStart, tEnd, desc ){
	this.year = year;
	this.month = month;
	this.date = date;
	this.startTime = tStart;
	this.endTime = tEnd;
	this.description = desc;
}

function getMonthInt( str ){
	if ( str.indexOf( "Jan" ) != -1 )
		return 1;
	else if ( str.indexOf( "Feb" ) != -1 )
		return 2;
	else if ( str.indexOf( "Mar" ) != -1 )
		return 3;
	else if ( str.indexOf( "Apr" ) != -1 )
		return 4;
	else if ( str.indexOf( "May" ) != -1 )
		return 5;
	else if ( str.indexOf( "Jun" ) != -1 )
		return 6;
	else if ( str.indexOf( "Jul" ) != -1 )
		return 7;
	else if ( str.indexOf( "Aug" ) != -1 )
		return 8;
	else if ( str.indexOf( "Sep" ) != -1 )
		return 9;
	else if ( str.indexOf( "Oct" ) != -1 )
		return 10;
	else if ( str.indexOf( "Nov" ) != -1 )
		return 11;
	else if ( str.indexOf( "Dec" ) != -1 )
		return 12;	
	else
		return -1;
}

var monthYearString = document.getElementsByTagName( "table" )[8].getElementsByTagName( "table" )[2].getElementsByTagName( "table" )[0].getElementsByTagName( "table" )[0].getElementsByTagName( "table" )[0].getElementsByTagName( "td" )[1].getElementsByTagName( "h2" )[0].innerHTML.trim();

var yearInt = monthYearString.substr( monthYearString.length - 4, 4 );
var monthInt = getMonthInt( monthYearString );

var Events = [];

function labelWeekRows(){
	var tab = document.getElementsByTagName( "table" )[11].getElementsByTagName( "table" )[1].children[0].children;
	
	var weeks = [];
	for ( var i = 2; i <= 6; i++ )
		weeks.push( tab[i] );
	
	for ( var i = 0; i < weeks.length; i++ ){
		var cur = weeks[i];
		cur.weekNumber = i;
		cur.className = "weekRow";
	}
}

function markAllBoxes(){
	var rows = document.getElementsByClassName( "weekRow" );
	
	for ( var i = 0; i < rows.length; i++ ){
		for ( var j = 0; j < 7; j++ ){
			var cell = rows[i].children[j];
			var p = rows[i].getElementsByClassName( "hint-down" )[j];
			var parent;
			if ( p )
				parent = p.parentNode;
			else
				parent = null;
			
			var month = monthInt;
			var date;
			
			if ( parent ){
				var link = parent.getElementsByClassName( "linkOtherMonth" )[0];
				if ( link ){
					date = link.innerHTML;
					month = getMonthInt( date );
					date = parseInt( date.substr( date.length - 2, 2 ) );
				}
					else{
					date = parent.childNodes[parent.childNodes.length - 3].textContent.trim();
					
					if ( isNaN( parseInt( date ) ) ){
						month = getMonthInt( date );
						date = parseInt( date.substr( date.length - 2, 2 ) );
					}
				}
				
				if ( i == 0 && date > 20 ){
					month = monthInt - 1;
					if ( month < 1 )
						month = 12;
				}
				else if ( i == 4 && date < 10 ){
					month = monthInt + 1;
					if ( month > 12 )
						month = 1;
				}
				
				cell.className = "eventDay week" + i.toString();
				cell.eventYear = parseInt( yearInt );
				cell.eventMonth = parseInt( month );
				cell.eventDate = parseInt( date );
			}
		}
	}
}

function collectEvents(){
	var eventDays = document.getElementsByClassName( "eventDay" );
	var weeks = getCheckedBoxes();
	
	for ( var i = 0; i < weeks.length; i++ ){
		var curWeek = weeks[i];
		var daysInWeek = document.getElementsByClassName( "eventDay week" + curWeek.toString() );
		for ( var j = 0; j < daysInWeek.length; j++ ){
			var day = daysInWeek[j];
			var hope = day.getElementsByClassName( "divContend" )[0];
			if ( hope && hope.children[1] ){
				var rawData = hope.children[1].children[0].children[0].children[0];
				
				rawData = rawData.innerHTML.trim().replace( "<br>", "" ).replace( "\n", "" ).replace( "\t", "" );
				
				var tStart = rawData.substr( 0, 8 );//.replace( " ", "" );
				var tEnd = rawData.substr( 9, 8 );//.replace( " ", "" );
				var desc = rawData.substring( 17, rawData.length ).trim();
				desc = desc.replace( "&amp;", "&" );
				
				Events.push( new Event( day.eventYear, day.eventMonth, day.eventDate, tStart, tEnd, desc ) );
			}
		}
	}
}

function generateCSV(){
	labelWeekRows();
	markAllBoxes();
	collectEvents();
	
	if ( Events.length == 0 ){
		console.error( "No events to generate a CSV for!" );
	}
	else{
		var outString = "Subject,Start Date,Start Time, End Date, End Time\n";
		
		for ( var i = 0; i < Events.length; i++ ){
			var cur = Events[i];
			var subject = cur.description + ",";
			var startDate = cur.month.toString() + "/" + cur.date.toString() +
							"/" + cur.year.toString() + ",";
			var startTime = cur.startTime.toString() + ",";
			
			var endDate;
			
			if ( cur.startTime.indexOf( "PM" ) != -1 && cur.endTime.indexOf( "AM" ) != -1 ){
				var tempDate = new Date( startDate );
				tempDate = tempDate.addDays( 1 );
				endDate = (tempDate.getMonth() + 1).toString() + "/" + 
						tempDate.getDate().toString() + "/" + cur.year.toString() + ",";
			}
			else
				endDate = startDate;
			
			var endTime = cur.endTime.toString() + "\n";
	
			outString = outString.concat( subject.concat( 
				startDate.concat( startTime.concat( endDate.concat( endTime ) ) ) ) );
		}
		
		var blob = new Blob( [outString], { type: "text/html" } );
		var url = window.URL.createObjectURL( blob );
		var a = document.createElement( "a" );
		a.download = "schedule.csv";
		a.href = url;
		a.click();
		window.URL.revokeObjectURL( url );
	}
}

function addButton(){
	var rightmenu = document.getElementsByClassName( "rightmenu" )[0];
	var exportButton = document.createElement( "a" );
	exportButton.innerHTML = "Export CSV";
	exportButton.style.cursor = "pointer";
	exportButton.addEventListener( "click", generateCSV );
	rightmenu.insertBefore( exportButton, rightmenu.childNodes[0] );
}

function addCheckBoxes(){
	var a = document.createElement( "a" );
	a.id = "checkBoxes";
	var inputs = [];
	for ( var i = 0; i < 5; i++ ){
		inputs.push( document.createElement( "input" ) );
	}
	for ( var i = 0; i < inputs.length; i++ ){
		inputs[i].type = "checkbox";
		inputs[i].id = "checkBox" + i.toString();
		inputs[i].checked = true;
		a.appendChild( inputs[i] );
		
		var span = document.createElement( "span" );
		span.innerHTML = (i+1).toString();
		a.appendChild( span );
	}
	var rightmenu = document.getElementsByClassName( "rightmenu" )[0];
	rightmenu.insertBefore( a, rightmenu.childNodes[0] );
}

function getCheckedBoxes(){
	var checkBoxes = document.getElementById( "checkBoxes" ).getElementsByTagName( "input" );
	var checked = [];
	for ( var i = 0; i < checkBoxes.length; i++ ){
		if ( checkBoxes[i].checked )
			checked.push( i );
	}
	return checked;
}

addButton();
addCheckBoxes();