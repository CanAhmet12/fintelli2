import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Chart.js bileşenlerini kaydet
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const PortfolioChart = ({ data }) => {
    if (!data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Grafik verilerini hazırla
    const chartData = {
        labels: data.map(item => item.date),
        datasets: [
            {
                label: 'Portföy Değeri',
                data: data.map(item => item.value),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Kar/Zarar',
                data: data.map(item => item.profitLoss),
                fill: false,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    drawBorder: false
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Toplam değerleri hesapla
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const totalProfitLoss = data.reduce((sum, item) => sum + item.profitLoss, 0);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1">
                    Toplam Değer: ₺{totalValue.toLocaleString()}
                </Typography>
                <Typography 
                    variant="body1" 
                    color={totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                >
                    Kar/Zarar: ₺{totalProfitLoss.toLocaleString()}
                </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
                <Line data={chartData} options={options} />
            </Box>
        </Box>
    );
};

export default PortfolioChart; 