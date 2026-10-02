const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, 'warnings.json');

if (!fs.existsSync(warningsPath)) {
    fs.writeFileSync(warningsPath, JSON.stringify([]));
}

setInterval(() => {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify([]));
        console.log('[⚠️] All warnings cleared automatically (10 minute interval)');
    } catch (error) {
        console.error('Error auto-clearing warnings:', error);
    }
}, 600000);

function getLinkWarnings() {
    try {
        const data = fs.readFileSync(warningsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading warnings.json:', error);
        return [];
    }
}

function saveLinkWarnings(warningsArray) {
    try {
        fs.writeFileSync(warningsPath, JSON.stringify(warningsArray, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing warnings.json:', error);
        return false;
    }
}

function getLinkWarningCount(senderNumber) {
    try {
        const warnings = getLinkWarnings();
        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                return parseInt(item.split('-')[1]) || 1;
            }
        }
        return 0;
    } catch (error) {
        console.error('Error getting warning count:', error);
        return 0;
    }
}

function addLinkWarning(senderNumber) {
    try {
        let warnings = getLinkWarnings();
        let found = false;
        let newWarnings = [];
        let newCount = 1;

        for (let item of warnings) {
            if (item.startsWith(senderNumber + '-')) {
                let currentCount = parseInt(item.split('-')[1]) || 1;
                newCount = currentCount + 1;
                newWarnings.push(`${senderNumber}-${newCount}`);
                found = true;
            } else {
                newWarnings.push(item);
            }
        }

        if (!found) {
            newWarnings.push(`${senderNumber}-1`);
        }

        saveLinkWarnings(newWarnings);
        return newCount;
    } catch (error) {
        console.error('Error adding warning:', error);
        return 1;
    }
}

function removeLinkWarning(senderNumber) {
    try {
        let warnings = getLinkWarnings();
        let newWarnings = warnings.filter(item => !item.startsWith(senderNumber + '-'));
        saveLinkWarnings(newWarnings);
        return true;
    } catch (error) {
        console.error('Error removing warning:', error);
        return false;
    }
}

function getWarning(senderNumber) {
    return getLinkWarningCount(senderNumber);
}

function addWarning(senderNumber) {
    return addLinkWarning(senderNumber);
}

function clearWarning(senderNumber) {
    return removeLinkWarning(senderNumber);
}

module.exports = {
    getWarning,
    addWarning,
    clearWarning
};