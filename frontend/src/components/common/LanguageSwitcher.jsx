import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLanguage } from '../../i18n/LanguageContext';

const LanguageSwitcher = () => {
    const { locale, switchLanguage } = useLanguage();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLanguageSelect = (lang) => {
        switchLanguage(lang);
        handleClose();
    };

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <TranslateIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem 
                    onClick={() => handleLanguageSelect('tr')}
                    selected={locale === 'tr'}
                >
                    Türkçe
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLanguageSelect('en')}
                    selected={locale === 'en'}
                >
                    English
                </MenuItem>
            </Menu>
        </>
    );
};

export default LanguageSwitcher; 