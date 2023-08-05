

fetch("http://localhost:4000/admin/Dashboard/chart")
.then((response) => response.json())
.then((data)=>{
    var ctx = document.getElementById("lineChart").getContext("2d");
        var myChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: data.labels,
            datasets: [
              {
                label: "Earnings in $",
                data: data.earningsByMonth,
                backgroundColor: ["rgba(85,85,85, 1)"],
                borderColor: "rgb(41, 155, 99)",
    
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
          },
        });
      })
