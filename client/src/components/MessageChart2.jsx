import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function MessageChart2({ info }) {
  const chartRef = useRef(null);

  useEffect(() => {

    const names = info.map(item => `${item.FIRST_NAME} ${item.LAST_NAME}`);
    const messageCounts = info.map(item => item.NRMESSAGES);

    if (chartRef.current) {
      const myChart = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: names,
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
          }
        }
      });
    }
  }, []);

  return <canvas ref={chartRef} />;
}

export default MessageChart2;
