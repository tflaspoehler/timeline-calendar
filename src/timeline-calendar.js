
	$(document).ready(function () {
		var timeline = {
			activeIndex: 0,
		};
		var today = moment(new Date()); // today's date
		var markets = [];				// combined market and dates from everywhere
		var events = [];                // events to put on the calendar

		// ------------------------
		// get dates from imc HubDB
		// ------------------------
		var parseImcDates = function(dates) {
			var month = dates.split(' ')[0];
			var start = dates.split(' ')[1];
			if (dates.includes('-')) {
				var end = dates.split(' ')[3].split(',')[0];
			}
			else {
				var start = end;
			}
			var year = dates.split(' ')[dates.split(' ').length-1];
			if (year.includes(',')) {
				year = year.split(',')[1].split()[0];
			}
			return {
				start: moment(month + ' ' + start + ' ' + year),
				end: moment(month + ' ' + end + ' ' + year),
			}
		}
		// ------------------------

		// -------------------------------------
		// update timeline when calendar changes
		// -------------------------------------
		var updateTimeline = function(e, calendar_date, priceIsRightRules = false) {
			/// sort markets by ones that are closest to current date
			var closestMarket = markets.filter(function(market) {
				return (priceIsRightRules) ? (new Date(market.start) >= new Date(calendar_date) || new Date(market.end) >= new Date(calendar_date)) : true 
			}).sort(function(a, b) {
				var aStart = new Date(a.start);
				var bStart = new Date(b.start);
				var cStart = new Date(calendar_date);
				var aEnd = new Date(a.end);
				var bEnd = new Date(b.end);
				var first  = Math.min(Math.abs(cStart - aStart), Math.abs(cStart - aEnd));
				var second = Math.min(Math.abs(cStart - bStart), Math.abs(cStart - bEnd));
				if (cStart >= aStart && cStart <= aEnd) {
					first = 0;
				}
				if (cStart >= bStart && cStart <= bEnd) {
					second = 0;
				}
				if (first > second) {
					return 1;
				}
				else if (first < second) {
					return -1;
				}
				else {
					return 0;
				}
			});
			timeline.slideTo(closestMarket[0].id, 0, true);
			timeline.activeIndex = closestMarket[0].id;
			$("#calendar").MEC({
				displayDate: new Date(calendar_date),
				events: events,
				activeIndex: closestMarket[0].id,
				updateTimeline: updateTimeline,
			});
		}
		// -------------------------------------

		// ----------------------------------
		// update calendar when slides change
		// ----------------------------------
		var updateCalendar = function() {
			var id = timeline.activeIndex
			$("#calendar").MEC({
				displayDate: new Date(markets[id].start),
				events: events,
				activeIndex: timeline.activeIndex,
				updateTimeline: updateTimeline,
			});
		}
		// ----------------------------------

		// ----------------------------
		// read in AMC markets from WEM
		// ----------------------------
		$.ajax({
			url: 'https://wem.americasmart.com/api/v1.1/market',
			success: function (amc_markets) {

				// add AMC markets to markets array
				//amc_markets.forEach(function(market) {
				//	if (market.masterShow.actualStartDate) {
				//		markets.push({
				//			id: market.marketID,
				//			name: market.marketName,
				//			start: moment(market.masterShow.actualStartDate),
				//			end: moment(market.masterShow.actualEndDate),
				//			location: 'amc',
				//		});
				//	}
				//});

				// ---------------------------------
				// read in HP/LV markets from HubDB
				// ---------------------------------
				$.ajax({
					url: 'https://api.hubapi.com/hubdb/api/v2/tables/1043159/rows?portalId=371301',
					success: function (imc_markets) {

						// add HP/LV markets to markets array
						Object.keys(imc_markets.objects).forEach(function (id) {
							var dates = parseImcDates(imc_markets.objects[id].values[2]);
							markets.push({
								name: imc_markets.objects[id].values[1],
								start: dates.start,
								end: dates.end,
								location: (imc_markets.objects[id].values[1].toLowerCase().includes('High Point'.toLowerCase()) || imc_markets.objects[id].values[1].toLowerCase().includes('Showtime'.toLowerCase())) ? 'hp' : (imc_markets.objects[id].values[1].toLowerCase().includes('Vegas'.toLowerCase())) ? 'lvm' : 'amc',
							});
						});

						// filter only markets after today
						markets = markets.filter(function(market) {
							return (market.end > today);
						});

						// sort markets array by date
						markets = markets.sort(function(a, b) {
							return new Date(a.start) - new Date(b.start);
						}).map(function(market, m) {
							market.id = m;
							return market;
						});

						// add market dates to the events array 
						markets.forEach(function(market, m) {
							var eventDay = moment(market.start);
							while (eventDay <= market.end) {
								events.push({
									title: market.name,
									id: m,
									date: new Date(eventDay),
									link: '#',
									location: market.location,
								});
								eventDay = eventDay.add(1, 'days');
							}
						});
						// create the calendar at todays date
						$("#calendar").MEC({
							events: events,
							activeIndex: timeline.activeIndex,
							updateTimeline: updateTimeline,
						});

						// add slides to timeline
						markets.forEach(function(market, m) {
							var new_slide = document.createElement("div");
							var second_month = (market.start.format('MM') == market.end.format('MM')) ? "" : market.end.format('MMMM ');
							var second_date = (market.start.isSame(market.end, 'day')) ? "" : " - " + second_month + market.end.format('Do')
							new_slide.className = "swiper-slide";
							new_slide.id =  "timeline-" + m;
							new_slide.innerHTML = '<div class="timeline-dates">' + market.start.format('MMMM Do') + second_date + market.end.format(', YYYY') + '</div><div class="timeline-market timeline-dot timeline-' + market.location + '">' + market.name + '</div>';
							$("#swiper-timeline").append(new_slide);
						});

						// initiate timeline swiper
						timeline = new Swiper('.swiper-container', {
							direction: 'vertical',
							slidesPerView: 'auto',
							spaceBetween: 0,
							freeMode: true,
							slideToClickedSlide: true,
							centeredSlides: true,
							keyboard: {
								enabled: true,
							},
							//pagination: {
							//	el: '.swiper-pagination',
							//	clickable: true,
							//	longSwipesMs: 150,
							//},
							slideChangeEnd : function(swiperHere) {
								updateCalendar();
							},
							transitionEnd: function(swiperHere) {
								updateCalendar();
							}
						});
						timeline.mousewheel.enable();
						timeline.on('slideChange', function () {
							updateCalendar();
						});
						timeline.slideTo(0, 0, true);
					}
				});
				// ---------------------------------

			}
		});
		// ----------------------------

	});