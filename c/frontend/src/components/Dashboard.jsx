import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import PortfolioChart from './PortfolioChart';
import MarketOverview from './MarketOverview';
import NewsPanel from './NewsPanel';
import AIChat from './AIChat';

const Dashboard = () => {
    const [portfolioData, setPortfolioData] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [newsData, setNewsData] = useState([]);
    const userId = localStorage.getItem('userId'); // Kullanıcı ID'sini localStorage'dan al

    useEffect(() => {
        if (userId) {
            fetchPortfolioData();
            fetchMarketData();
            fetchNews();
        }
    }, [userId]);

    const fetchPortfolioData = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/portfolio/${userId}`);
            const data = await response.json();
            setPortfolioData(data);
        } catch (error) {
            console.error('Portföy verileri alınamadı:', error);
        }
    };

    const fetchMarketData = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/market/analysis/overview`);
            const data = await response.json();
            setMarketData(data);
        } catch (error) {
            console.error('Piyasa verileri alınamadı:', error);
        }
    };

    const fetchNews = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/news`);
            const data = await response.json();
            setNewsData(data);
        } catch (error) {
            console.error('Haberler alınamadı:', error);
        }
    };

    if (!userId) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">
                    Lütfen giriş yapın
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={3}>
                {/* Portföy Özeti */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            Portföy Performansı
                        </Typography>
                        <PortfolioChart data={portfolioData} />
                    </Paper>
                </Grid>

                {/* AI Chatbot */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <AIChat userId={userId} />
                    </Paper>
                </Grid>

                {/* Piyasa Özeti */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <MarketOverview data={marketData} />
                    </Paper>
                </Grid>

                {/* Haberler */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <NewsPanel news={newsData} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 