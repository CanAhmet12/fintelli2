import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
    Box, 
    Paper, 
    TextField, 
    Button, 
    Typography, 
    Alert,
    Container,
    CircularProgress
} from '@mui/material';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { addNotification } from '../../store/slices/notificationSlice';
import api from '../../services/api';

// Validation şeması
const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Geçerli bir e-posta adresi giriniz')
        .required('E-posta adresi gereklidir'),
    password: Yup.string()
        .min(6, 'Şifre en az 6 karakter olmalıdır')
        .required('Şifre gereklidir')
});

const Login = () => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);
    const navigate = useNavigate();

    const handleSubmit = async (values, { setSubmitting }) => {
        dispatch(loginStart());

        try {
            const response = await api.post('/auth/login', values);
            
            dispatch(loginSuccess({
                user: response.data.user,
                token: response.data.token
            }));

            dispatch(addNotification({
                type: 'success',
                message: 'Başarıyla giriş yapıldı!'
            }));

            navigate('/dashboard');
        } catch (err) {
            dispatch(loginFailure(err.response?.data?.message || 'Giriş başarısız'));
            dispatch(addNotification({
                type: 'error',
                message: err.response?.data?.message || 'Giriş yapılırken bir hata oluştu'
            }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom align="center">
                        Fintelli'ye Hoş Geldiniz
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={LoginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched, handleChange, handleBlur, values, isSubmitting }) => (
                            <Form>
                                <TextField
                                    fullWidth
                                    name="email"
                                    label="E-posta"
                                    type="email"
                                    margin="normal"
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.email && Boolean(errors.email)}
                                    helperText={touched.email && errors.email}
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    name="password"
                                    label="Şifre"
                                    type="password"
                                    margin="normal"
                                    value={values.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched.password && Boolean(errors.password)}
                                    helperText={touched.password && errors.password}
                                    disabled={loading}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3 }}
                                    disabled={loading || isSubmitting}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Giriş Yap'
                                    )}
                                </Button>
                            </Form>
                        )}
                    </Formik>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login; 