// import the getUserData function
import { getUserData } from './getUserData.js';

// loads user data and updates the profile form fields
export async function setUserData() {
    try {
        // fetch all profile data at once
        const [name, uid, email, age, totp, pfp, parent] = await getUserData();

        // update the name, uid, and email placeholders
        const nameInput = document.getElementById("nameChangeInput");    // full name
        const uidInput = document.getElementById("uidChangeInput");      // github id
        const emailInput = document.getElementById("emailChangeInput");  // email
        const ageInput = document.getElementById("ageChangeInput");      // age
        const totpCheckbox = document.getElementById("totpChangeInput"); // 2FA toggle
        const parentInput = document.getElementById("parentChangeInput"); // parent/guardian
        //const sidebar = document.getElementById("sidebarWelcome");       // sidebar welcome message
        //const sidebarPfp = document.getElementById("sidebarPfp");        // sidebar profile picture

        nameInput.value = name ? name : "Failed to load name. Are you logged in?";
        uidInput.value = uid ? uid : "Failed to load UID. Are you logged in?";
        emailInput.value = email ? email : "Failed to load email. Are you logged in?";
        if (ageInput) ageInput.value = age !== null ? age : "";
        totpCheckbox.checked = totp;
        // Sync the toggle dot visual state
        const totpDot = document.querySelector(".dot-totp");
        if (totpDot && totp) totpDot.classList.add("translate-x-3");

        // Show parent field and populate if user is a minor
        if (age !== null && age < 18) {
            const wrapper = document.getElementById("parentFieldWrapper");
            if (wrapper) wrapper.classList.remove("hidden");
            if (parentInput && parent) parentInput.value = parent;
        }
        
        //sidebar.innerHTML = 'Welcome,<br>' + name;
        //sidebarPfp.src = pfp ? pfp : "{{site.baseurl}}/images/default.png"
    } catch (error) {
        console.error("error setting placeholders:", error.message);
    }
}