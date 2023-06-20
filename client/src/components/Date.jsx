import React from 'react';

function DateTimeDisplay(props) {
  const { dateTime } = props;
  
  // create a Date object from the string
  const jsDate = new Date(dateTime);
  
  // format the date using the toLocaleDateString() method
  const formattedDate = jsDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // format the time using the toLocaleTimeString() method
  const formattedTime = jsDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });
  
  return (
    <div>
      <h6>{formattedDate}</h6>
      <h6>{formattedTime}</h6>
    </div>
  );
}

export default DateTimeDisplay;
