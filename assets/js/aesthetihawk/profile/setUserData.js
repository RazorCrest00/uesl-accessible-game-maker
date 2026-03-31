import { getUserData } from './getUserData.js';

export async function setUserData() {
    try {
        const [name, uid, email, age, totp, pfp, parent_email, location, role, classes, auth_type] = await getUserData();

        const nameInput   = document.getElementById("nameChangeInput");
        const uidInput    = document.getElementById("uidChangeInput");
        const emailInput  = document.getElementById("emailChangeInput");
        const ageInput    = document.getElementById("ageChangeInput");
        const totpCheckbox = document.getElementById("totpChangeInput");
        const parentInput = document.getElementById("parentChangeInput");

        nameInput.value  = name  || "Failed to load. Are you logged in?";
        uidInput.value   = uid   || "Failed to load. Are you logged in?";
        emailInput.value = email || "Failed to load. Are you logged in?";
        if (ageInput) ageInput.value = age !== null ? age : "";

        totpCheckbox.checked = totp;
        const totpDot = document.querySelector(".dot-totp");
        if (totpDot && totp) totpDot.classList.add("translate-x-3");

        // Show parent field if minor
        if (age !== null && age < 18) {
            const wrapper = document.getElementById("parentFieldWrapper");
            if (wrapper) wrapper.classList.remove("hidden");
            if (parentInput && parent_email) parentInput.value = parent_email;
        }

        // Populate Account Statistics
        const statRole     = document.getElementById("stat-role");
        const statAuth     = document.getElementById("stat-auth");
        const statLocation = document.getElementById("stat-location");
        const statClasses  = document.getElementById("stat-classes");

        if (statRole) statRole.textContent = role || 'User';
        if (statAuth) statAuth.textContent = auth_type || 'otp';
        if (statLocation) statLocation.textContent = location || 'Unknown';
        if (statClasses) {
            if (classes.length > 0) {
                statClasses.innerHTML = classes.map(c =>
                    `<span class="stat-chip">${c}</span>`
                ).join('');
            } else {
                statClasses.innerHTML = '<span style="color:#8b949e;font-size:0.85rem;">No classes enrolled</span>';
            }
        }

    } catch (error) {
        console.error("error setting user data:", error.message);
    }
}
