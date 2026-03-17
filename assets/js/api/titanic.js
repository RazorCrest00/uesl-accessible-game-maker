---
---

// ^^ Do not remove the above front matter, it is required for Jekyll processing

/**
 * Titanic API Module
 * Connects to the Darshan-Flask backend on port 8587
 */

// Darshan-Flask backend URI — separate from the main Datastream backend
export const titanicURI = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8587"
    : "https://flask.opencodingsociety.com"; // update if Darshan-Flask is deployed to a different domain

const titanicFetchOptions = {
    mode: 'cors',
    cache: 'default',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'X-Origin': 'client'
    }
};

/**
 * Predict survival probability for a passenger
 * @param {Object} passenger - Passenger data
 * @param {string} passenger.name
 * @param {number} passenger.pclass - 1, 2, or 3
 * @param {string} passenger.sex - 'male' or 'female'
 * @param {number} passenger.age
 * @param {number} passenger.sibsp - siblings/spouses aboard
 * @param {number} passenger.parch - parents/children aboard
 * @param {number} passenger.fare
 * @param {string} passenger.embarked - 'C', 'Q', or 'S'
 * @param {boolean} passenger.alone
 * @returns {Promise<{die: number, survive: number}>}
 */
export async function predictSurvival(passenger) {
    const response = await fetch(`${titanicURI}/api/titanic/predict`, {
        ...titanicFetchOptions,
        method: 'POST',
        body: JSON.stringify(passenger)
    });
    if (!response.ok) throw new Error(`Predict error: ${response.status}`);
    return await response.json();
}

/**
 * Get feature importance weights from the decision tree model
 * @returns {Promise<Object>} - { feature: importance, ... }
 */
export async function getFeatureWeights() {
    const response = await fetch(`${titanicURI}/api/titanic/feature_weights`, {
        ...titanicFetchOptions,
        method: 'GET'
    });
    if (!response.ok) throw new Error(`Feature weights error: ${response.status}`);
    return await response.json();
}
