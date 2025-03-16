import React from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Paper, 
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const MarketOverview = ({ data }) => {
    if (!data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    const { indices, topMovers } = data;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Piyasa Özeti
            </Typography>

            {/* Piyasa Endeksleri */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {indices.map((index) => (
                    <Grid item xs={12} sm={6} md={4} key={index.name}>
                        <Paper 
                            sx={{ 
                                p: 2,
                                bgcolor: index.change >= 0 ? 'success.light' : 'error.light',
                                color: 'white'
                            }}
                        >
                            <Typography variant="subtitle2" gutterBottom>
                                {index.name}
                            </Typography>
                            <Typography variant="h6">
                                {index.value.toLocaleString()}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                {index.change >= 0 ? 
                                    <TrendingUpIcon fontSize="small" /> : 
                                    <TrendingDownIcon fontSize="small" />
                                }
                                <Typography variant="body2" sx={{ ml: 0.5 }}>
                                    {index.change}%
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* En Çok Hareket Edenler */}
            <Typography variant="subtitle1" gutterBottom>
                En Çok Hareket Edenler
            </Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Sembol</TableCell>
                            <TableCell align="right">Fiyat</TableCell>
                            <TableCell align="right">Değişim %</TableCell>
                            <TableCell align="right">Hacim</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {topMovers.map((stock) => (
                            <TableRow key={stock.symbol}>
                                <TableCell component="th" scope="row">
                                    {stock.symbol}
                                </TableCell>
                                <TableCell align="right">
                                    ₺{stock.price.toLocaleString()}
                                </TableCell>
                                <TableCell 
                                    align="right"
                                    sx={{ 
                                        color: stock.change >= 0 ? 'success.main' : 'error.main',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {stock.change}%
                                </TableCell>
                                <TableCell align="right">
                                    {(stock.volume / 1000000).toFixed(2)}M
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MarketOverview; 