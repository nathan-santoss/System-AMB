export default {
    content: ['../frontend/views/**/*.ejs', '../frontend/public/js/**/*.js'],
    theme: { extend: {
        colors: { azulEscuro: '#1e3a8a', azulPrincipal: '#2563eb', vermelhoAlerta: '#b91c1c', cinzaFundo: '#f4f7f6', cinzaTexto: '#334155' },
        fontFamily: { sans: ['Inter', 'sans-serif'] }, boxShadow: { painel: '0 10px 30px rgba(15,23,42,.08)' }
    } }, plugins: []
};
