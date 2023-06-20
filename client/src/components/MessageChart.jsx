import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function MessageChart({ messages }) {
  const chartRef = useRef(null);

  useEffect(() => {
    const messageCounts = new Array(5).fill(0);
    messages.forEach((message) => {
      const date = new Date(message.MESSAGE_DATE);
      const hours = date.getHours();
      
      console.log("ora", date, hours);
      if (hours >= 8 && hours <= 16) {
        const interval = Math.floor((hours - 8) / 2);
        messageCounts[interval]++;
      }
    });

    if (chartRef.current) {
      const myChart = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ['8-10', '10-12', '12-14', '14-16'],
          datasets: [{
            label: 'Number of Messages',
            data: messageCounts,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'black',
            borderWidth: 2
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          layout: {
            padding: {
              bottom: 5
            }
          },
        }
      });
    }
  }, []);

  return <canvas ref={chartRef} />;
}

export default MessageChart;
