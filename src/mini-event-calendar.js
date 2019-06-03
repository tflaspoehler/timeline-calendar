(function( $ ) {
	var calenderTpl = `
		<div id="calTitle">
			<button type="button" class="month-mover prev">
				<svg fill="#FFFFFF" height="30" viewBox="0 0 24 24" width="30" xmlns="http://www.w3.org/2000/svg">
					<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
				</svg>
			</button>
			<div id="monthYear"></div>
			<button type="button" class="month-mover next">
				<svg fill="#FFFFFF" height="30" viewBox="0 0 24 24" width="30" xmlns="http://www.w3.org/2000/svg">
					<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
				</svg>
			</button>
		</div>
		<div>
			<div id="calThead"></div>
			<div id="calTbody"></div>
		</div>
		<div id="calTFooter">
			<div class="timeline-dot timeline-amc calLegend">Atlanta</div>
			<div class="timeline-dot timeline-hp calLegend">High Point</div>
			<div class="timeline-dot timeline-lvm calLegend">Las Vegas</div>
		</div>
	`;
	var weekDaysFromSunday = '<div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>';
	var weekDaysFromMonday = '<div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>';
	var shortMonths = ["January", "February", "March", "April", "May", "June", "July","August", "September", "October", "November", "December"];

    $.fn.miniEventCalendar = $.fn.MEC = function(options) {
    	var settings = $.extend({
			calendar_link : "",
    		events: [],
			from_monday: false,
			onMonthChanged: null
        }, options );

		var miniCalendar = this;
		miniCalendar.off();

        miniCalendar.addClass('mini-cal').html(calenderTpl);

		var thead = miniCalendar.find("#calThead");
		var tbody = miniCalendar.find("#calTbody");
		var calTitle = miniCalendar.find("#monthYear");
		var calFooter = miniCalendar.find("#calTFooter");
        var eventTitle = miniCalendar.find("#eventTitle");
		var eventsLink = miniCalendar.find("#calLink");

		var today = (settings.hasOwnProperty('displayDate')) ? settings.displayDate : new Date();
		var curMonth = today.getMonth();
		var curYear = today.getFullYear();

        eventTitle.text("No events today.");
		eventsLink.text("ALL EVENTS");
		eventsLink.attr("href", settings.calendar_link);

		if(settings.from_monday)
			thead.html(weekDaysFromMonday);
		else
			thead.html(weekDaysFromSunday);

		if(!settings.calendar_link.length && !settings.events.length)
			calFooter.css("display", "none");

		miniCalendar.find(".month-mover").each(function(){
			var mover = $(this);
			mover.bind("click", function(e){
				e.preventDefault();
				if(mover.hasClass("next"))
					viewNextMonth();
				else
					viewPrevMonth();
			});
		});

		miniCalendar.on("click touchstart", ".a-date", function(e){
			e.preventDefault(); 
			if ($(this).hasClass('has-market')) {
				settings.updateTimeline(e, $(this).attr('data-date'));
			}
		});

		function populateCalendar(month, year, onInit) {
			tbody.html("");
			calTitle.text(shortMonths[month] + " " + year);
			eventTitle.text("Click day to see event");
			eventsLink.text("All Events");
			eventsLink.attr("href", "#");


			curMonth = month;
			curYear = year;

			var ldate = new Date(year, month);
			var dt = new Date(ldate);
			var weekDay = dt.getDay();

			if(settings.from_monday)
				weekDay = dt.getDay() > 0 ? dt.getDay() - 1 : 6;

			if(ldate.getDate() === 1)
				tbody.append(lastDaysOfPrevMonth(weekDay));
			while (ldate.getMonth() === month) {
     			dt = new Date(ldate);

     			var isToday = areSameDate(ldate, new Date());
     			var event = null;
     			var eventIndex = settings.events.findIndex(function(ev) {
		     		return areSameDate(dt, new Date(ev.date));
		     	});
		     	var todaysEvents = [];

		     	// add all events to this day that exist
		     	settings.events.forEach(function(event) {
		     		if (areSameDate(dt, event.date)) {
		     			todaysEvents.push(event);
		     		}
		     	});

		        if(eventIndex != -1){
		        	event = settings.events[eventIndex];

		        	if(onInit && isToday)
		        		showEvent(event);
		        }

     			tbody.append(dateTpl(false, ldate, isToday, onInit && isToday));

     			ldate.setDate(ldate.getDate() + 1);

     			var bufferDays = 43 - miniCalendar.find(".a-date").length;

		        if(ldate.getMonth() != month){
		        	for(var i = 1; i < bufferDays; i++){
     					dt = new Date(ldate);
						tbody.append(dateTpl(true, dt, false));
     					ldate.setDate(ldate.getDate() + 1);
					}
				}
			}
			 
			if(settings.onMonthChanged){
				settings.onMonthChanged(month, year);
			}
 		}

 		function lastDaysOfPrevMonth(day){
 			if(curMonth > 0){
				var monthIdx = curMonth - 1;
				var yearIdx = curYear;
			}
			else{
     			if(curMonth < 11){
     				var monthIdx = 0;
     				var yearIdx = curYear + 1;
     			}else{
     				var monthIdx = 11;
     				var yearIdx = curYear - 1;
     			}
     		}
     		
     		var prevMonth = getMonthDays(monthIdx, yearIdx);
     		var lastDays = "";
        	for (var i = day; i > 0; i--) {
     			lastDays += dateTpl(true, new Date(yearIdx + '-' + (monthIdx+1) + '-' + prevMonth[prevMonth.length - i]));
        	}

        	return lastDays;
 		}

		function dateTpl(blurred, date, isToday, isSelected){
			var tpl = "<div class='a-date blurred'><span>"+date+"</span></div>";
			var eventDots = "";
			var hasEvent = false;
	        var cls = isToday ? "current " : "";
	        var todaysEvents = []
	        var eventData = "";

	        // add blur for dates that aren't the current month
	        cls += (blurred) ? "blurred " : "";

	     	// add all events to this day that exist
	     	settings.events.forEach(function(ev) {
	     		if (areSameDate(date, ev.date)) {
	     			todaysEvents += ev;
	     			hasEvent = true;
			    	eventDots += "<div class='cal-event-" + ev.location + "'></div>";
			    	// if this is the active market in the timeline
			    	if (ev.id == settings.activeIndex) {
			    		cls += "active-market ";
			    	}
	     		}
	     	});

	     	// select the earliest event for today to send back to timeilne if clicked
	     	eventData = (todaysEvents.length > 1) ? JSON.stringify(todaysEvents[0]) : "";

	     	// add styling if there are markets
			if (hasEvent) {
				cls += "has-market ";
			}

			// make the day button
	        tpl = "<button type='button' class='a-date "+cls+"' data-date='" + date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "'><span>"+date.getDate()+"</span><div class='cal-events'>" + eventDots + "</div></button>";


			return tpl;
		}

		function showEvent(event){
			if(event && event !== null && event !== undefined){
				eventTitle.text(event.title);
				eventsLink.text("VIEW EVENT");
				eventsLink.attr("href", event.link);
			}else{
				eventTitle.text("No events on this day.");
				eventsLink.text("ALL EVENTS");
				eventsLink.attr("href", settings.calendar_link);
			}
		}

		function viewNextMonth(){
			var nextMonth = curMonth < 11 ? curMonth + 1 : 0;
			var nextYear = curMonth < 11 ? curYear : curYear + 1;
			settings.updateTimeline(null, nextYear + '-' + (nextMonth+1) + '-1', true)
			// populateCalendar(nextMonth, nextYear);
		}

		function viewPrevMonth(){
			var prevMonth = curMonth > 0 ? curMonth - 1 : 11;
			var prevYear = curMonth > 0 ? curYear : curYear - 1;
			settings.updateTimeline(null, prevYear + '-' + (prevMonth+1) + '-1', true)
			// populateCalendar(prevMonth, prevYear);
		}

		function areSameDate(d1, d2) {
			return d1.getFullYear() == d2.getFullYear()
		        && d1.getMonth() == d2.getMonth()
		        && d1.getDate() == d2.getDate();
		}

		function getMonthDays(month, year) {
			var date = new Date(year, month, 1);
			var days = [];
			while (date.getMonth() === month) {
				days.push(date.getDate());
				date.setDate(date.getDate() + 1);
			}
			return days;
		}

		populateCalendar(curMonth, curYear, true);

        return miniCalendar;
    };
 
}( jQuery ));