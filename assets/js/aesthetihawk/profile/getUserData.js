// import config for api urls and fetch options
import { pythonURI, fetchOptions } from '../../api/config.js';

// fetches all profile data and returns it as an array
export async function getUserData() {
    const pythonURL = pythonURI + "/api/id";

    let name = null, uid = null, email = null, age = null;
    let totpEnabled = null, pfp = null, parent_email = null;
    let location = null, role = null, classes = [], auth_type = null;

    try {
        const response = await fetch(pythonURL, fetchOptions);
        if (response.ok) {
            const data = await response.json();

            name         = data.name;
            uid          = data.uid;
            email        = data.email;
            totpEnabled  = data.totp_enabled !== undefined ? data.totp_enabled : true;
            pfp          = data.pfp;
            parent_email = data.parent_email || null;
            location     = data.location || 'Unknown';
            role         = data.role || 'User';
            classes      = Array.isArray(data.class) ? data.class : [];
            auth_type    = data.auth_type || 'otp';

            // Calculate age from birthdate (YYYY-MM-DD)
            if (data.birthdate) {
                const bdate = new Date(data.birthdate);
                const today = new Date();
                age = today.getFullYear() - bdate.getFullYear();
                const m = today.getMonth() - bdate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) age--;
            }
        } else {
            console.error('error fetching data:', response.status);
        }
    } catch (error) {
        console.error('error fetching data:', error.message);
    }

    return [name, uid, email, age, totpEnabled, pfp, parent_email, location, role, classes, auth_type];
}
