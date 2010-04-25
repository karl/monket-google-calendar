(function(){
  var _a, _b;
  // Parse a date string into a Date object
  // String MUST be encoded as "YYYY-MM-DD"
  Date.parseYMD = function parseYMD(dateString) {
    var dateValues;
    dateValues = dateString.split("-");
    if (dateValues.length !== 3) {
      throw "Unable to parse date string: " + dateString;
    }
    return new Date(dateValues[0], dateValues[1] - 1, dateValues[2]);
  };
  // Return a new date, equal to this date with a number of days added to it
  // numDays can be negative to subract days
  Date.prototype.addDays = function addDays(numDays) {
    var date;
    date = new Date(this.getTime());
    date.setDate(date.getDate() + numDays);
    return date;
  };
  // Return a new date, equal to this date with a number of weeks added to it
  // numWeeks can be negative to subract days
  Date.prototype.addWeeks = function addWeeks(numWeeks) {
    return this.addDays(numWeeks * 7);
  };
  // Format a date using a given format string
  // Copied from: http://phrogz.net/JS/Classes/ExtendingJavaScriptObjectsAndClasses.html#example2
  Date.prototype.customFormat=function(formatString) {
   var YYYY,YY,MMMM,MMM,MM,M,DDDD,DDD,DD,D,hhh,hh,h,mm,m,ss,s,ampm,dMod,th;
   YY = ((YYYY=this.getFullYear())+"").substr(2,2);
   MM = (M=this.getMonth()+1)<10?('0'+M):M;
   MMM = (MMMM=["January","February","March","April","May","June","July","August","September","October","November","December"][M-1]).substr(0,3);
   DD = (D=this.getDate())<10?('0'+D):D;
   DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substr(0,3);
   th=(D>=10&&D<=20)?'th':((dMod=D%10)==1)?'st':(dMod==2)?'nd':(dMod==3)?'rd':'th';
   formatString = formatString.replace("#YYYY#",YYYY).replace("#YY#",YY).replace("#MMMM#",MMMM).replace("#MMM#",MMM).replace("#MM#",MM).replace("#M#",M).replace("#DDDD#",DDDD).replace("#DDD#",DDD).replace("#DD#",DD).replace("#D#",D).replace("#th#",th);
   h=(hhh=this.getHours());
   if (h === 0) {
		h=24;
	}
   if (h>12) {
		h-=12;
	}
   hh = h<10?('0'+h):h;
   ampm=hhh<12?'am':'pm';
   mm=(m=this.getMinutes())<10?('0'+m):m;
   ss=(s=this.getSeconds())<10?('0'+s):s;
   return formatString.replace("#hhh#",hhh).replace("#hh#",hh).replace("#h#",h).replace("#mm#",mm).replace("#m#",m).replace("#ss#",ss).replace("#s#",s).replace("#ampm#",ampm);
};
  String.prototype.endsWith = (typeof (_a = String.prototype.endsWith) !== "undefined" && _a !== null) ? String.prototype.endsWith : function(suffix) {
    var startPos;
    startPos = this.length - suffix.length;
    if (startPos >= 0) {
      return this.lastIndexOf(suffix, startPos) === startPos;
    } else {
      return false;
    }
  };
  Array.remove = (typeof (_b = Array.remove) !== "undefined" && _b !== null) ? Array.remove : function(array, from, to) {
    var rest;
    rest = array.slice((to || from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
  };
})();
