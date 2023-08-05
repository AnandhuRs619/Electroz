fetch("http://localhost:4000/admin/Dashboard/chart")
.then((response) => response.json())
.then((data)=>{

   const labels=data.mostSoldCategory.map(categoryData => `${categoryData.category} (${categoryData.count})`);

    var ctx2 = document.getElementById('doughnut').getContext('2d');
var myChart2 = new Chart(ctx2, {
    type: 'doughnut',
    data: {

        datasets: [{
            label: labels,
            data:data.mostSoldCategory.map(categoryData => categoryData.count),
            backgroundColor: [
                'rgba(41, 155, 99, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(120, 46, 139,1)'

            ],
            borderColor: [
                'rgba(41, 155, 99, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(120, 46, 139,1)'

            ],
            borderWidth: 1
        }]

    },
    options: {
        responsive: true
    }
});
})