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

    useEffect(() => {
        // Portföy verilerini çek
        fetchPortfolioData();
        // Piyasa verilerini çek
        fetchMarketData();
        // Haberleri çek
        fetchNews();
    }, []);

    const fetchPortfolioData = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/portfolio/${userId}`);
            const data = await response.json();
            setPortfolioData(data);
        } catch (error) {
            console.error('Portföy verileri alınamadı:', error);
        }
    };

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
                        <AIChat />
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