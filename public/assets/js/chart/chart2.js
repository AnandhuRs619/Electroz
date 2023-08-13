fetch("/admin/Dashboard/chart")
.then((response) => response.json())
.then((data)=>{

    const outputNames = data.salesByProductName.map(item => item._id);
    const outputTotals =  data.salesByProductName.map(item => item.total);

    var ctx2 = document.getElementById('doughnut').getContext('2d');
var myChart2 = new Chart(ctx2, {
    type: 'doughnut',
    data: {
        labels: outputNames,
        datasets: [{
            label: 'Employees',
            data:outputTotals,
            backgroundColor: [
                'rgba(41, 155, 99, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(120, 46, 139,1)',
                'rgba(200, 100, 50, 1)'

            ],
            borderColor: [
                'rgba(41, 155, 99, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(120, 46, 139, 1)',
                'rgba(200, 100, 50, 1)' 

            ],
            borderWidth: 1
        }]

    },
    options: {
        responsive: true
    }
});
})