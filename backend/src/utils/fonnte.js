/**
 * Fonnte API Stub - untuk integrasi pengiriman WhatsApp Server-side (opsional/ekstensi UAS)
 */
const https = require('https');
require('dotenv').config();

exports.sendWhatsapp = (target, message) => {
    const token = process.env.FONNTE_TOKEN;
    if (!token) {
        console.log('FONNTE_TOKEN tidak di-set di env. Skip pengiriman notifikasi WA.');
        return Promise.resolve({ status: false, reason: 'No token' });
    }

    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            target: target,
            message: message
        });

        const options = {
            hostname: 'api.fonnte.com',
            path: '/send',
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed);
                } catch (e) {
                    resolve({ status: false, error: body });
                }
            });
        });

        req.on('error', (err) => {
            console.error('Fonnte send error:', err);
            reject(err);
        });

        req.write(data);
        req.end();
    });
};
