const helper = require('./helper');
const firstDay = new Date(2023, 0, 1);
const fdMilliseconds = firstDay.getTime();
const timestamp = helper.createTimestamp(Date.now());

function isLeapYear(year) {
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
        return true;
    } else {
        return false;
    }
}

function getDayOfWeek(year, month, day) {
    if (month < 3) {
        month += 12;
        year -= 1;
    }
    
    const k = year % 100;
    const j = Math.floor(year / 100);
    
    const dayOfWeek = (day + Math.floor(13 * (month + 1)) / 5 + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
    
    // The result of the formula: 0 (Saturday), 1 (Sunday), 2 (Monday), ..., 6 (Friday)
    const index = Math.floor(dayOfWeek);
    const daysOfWeek = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return daysOfWeek[index];
}


function getFormatedDate(date){
    

    switch(date.month){
        case 1:
            date.month = 'January';
            break;
        case 2:
            date.month = 'February';
            break;
        case 3:
            date.month = 'March';
            break;
        case 4:
            date.month = 'April';
            break;
        case 5:
            date.month = 'May';
            break;
        case 6:
            date.month = 'June';
            break;
        case 7:
            date.month = 'July';
            break;
        case 8:
            date.month = 'August';
            break;
        case 9:
            date.month = 'September';
            break;
        case 10:
            date.month = 'October';
            break;
        case 11:
            date.month = 'November';
            break;
        case 12:
            date.month = 'December';
            break;
        default:
            return 'ERROR';
    }

    let daySuffix;
    if (date.day === 1 || date.day === 21 || date.day === 31) {
        daySuffix = 'st';
    } else if (date.day === 2 || date.day === 22) {
        daySuffix = 'nd';
    } else if (date.day === 3 || date.day === 23) {
        daySuffix = 'rd';
    } else {
        daySuffix = 'th';
    }

    const formatedDate = `${date.month} ${date.day}${daySuffix}, ${date.year}`;
    return formatedDate;
}

function getDate(timestamp){
    const month = parseInt(timestamp.slice(5, 7));
    const day = parseInt(timestamp.slice(8, 10));
    const year = parseInt(timestamp.slice(0, 4));

    const date = {
        year: year,
        month: month,
        day: day
    };
    return date;
}

function calculateWeeks(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    
    const completeWeeks = Math.floor((daysInMonth + firstDayOfWeek - 1) / 7);
    const remainingDays = (daysInMonth + firstDayOfWeek - 1) % 7;
    
    // Add an extra week if there are remaining days or if the month starts on a Sunday
    const totalWeeks = completeWeeks + (remainingDays > 0 || firstDayOfWeek === 0 ? 1 : 0);
    
    return totalWeeks;
}

// Function to generate the calendar data
function generateCalendarData(year, month) {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Adjust February days for leap years
    if (isLeapYear(year)) {
        daysInMonth[1] = 29;
    }

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];

    let day = 1;
    // Fill the cells before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push('x');
    }

    // Fill the rest of the calendar
    while (day <= daysInMonth[month]) {
        days.push(day.toString());

        if ((firstDayOfWeek + day) % 7 === 0) {
            days.push(null);
        }

        day++;
    }

    // Complete any remaining empty cells in the last row
    while ((firstDayOfWeek + day - 1) % 7 !== 0) {
        days.push('x');
        day++;
    }
    let weeksArray = [];
    const weekCount = calculateWeeks(year, month)
    for (let i = 0; i < weekCount; i++){
        weeksArray.push([]);
    }
    let weekNumber = 0;
    for (let i = 0; i < days.length; i++){
        if (days[i] !== null){
            weeksArray[weekNumber].push({day:days[i]});
        }   
        else{
            weekNumber++;
        }
    }
    let plannedMeals = [];
    let plannedMealsImgs = [];
    for(weeks in weeksArray){

    }
    console.log(daysInMonth[month].toString());
    const firstDay = (element) => element === '1';
    const lastDay = (element) => element === daysInMonth[month].toString();
    const firstDayIndex = days.findIndex(firstDay);
    const lastDayIndex = weeksArray.findIndex(lastDay);
    return {
        year,
        monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
        weekCount,
        weeksArray,
        days,
        firstDayIndex: firstDayIndex,
        lastDayIndex: lastDayIndex
    };
}



module.exports = {
    generateCalendarData: generateCalendarData,
    isLeapYear: isLeapYear,
    getDayOfWeek: getDayOfWeek,
    getFormatedDate: getFormatedDate,
    getDate: getDate
}