const { log } = require('console');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'ses.json');

function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(
                DATA_FILE, '[]',
                (err) => {
                    if(err){
                        console.error("Error creating the file:", err);
                    } else {
                        console.log("The file was created successfully!");
                    }
                }
            )
        } 
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        
        if (!data || data.trim() === '') {
            return [];
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Read error:', error.message);
        return [];
    }
}

function writeData(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Write error:', error);
        return false;
    }
}

app.get('/api/ses', (req, res) => {
    let sesList = readData();
    const { type } = req.query;
    
    if (type && type !== 'all') {
        sesList = sesList.filter(ses => ses.objectType === type);
    }
    res.json(sesList);
});

app.get('/api/ses/stats', (req, res) => {
    const sesList = readData();
    const totalCount = sesList.length;
    const totalPower = sesList.reduce((sum, ses) => sum + parseFloat(ses.totalPower), 0);
    const withBatteries = sesList.filter(ses => ses.hasBattery).length;

    res.json({ totalCount, totalPower: totalPower.toFixed(2), withBatteries });
});

app.post('/api/ses', (req, res) => {
    try {
        const newSES = {
            id: Date.now().toString(),
            owner: req.body.owner,
            objectType: req.body.objectType,
            address: req.body.address,
            panelType: req.body.panelType,
            panelPower: req.body.panelPower,
            panelCount: req.body.panelCount,
            totalPower: req.body.totalPower, 
            hasBattery: req.body.hasBattery === 'on',
            batteryCapacity: req.body.batteryCapacity || 0,
            date: new Date().toISOString()
        };

        const sesList = readData();
        sesList.push(newSES);

        if (writeData(sesList)) {
            res.status(201).json({ success: true, message: 'The SES has been successfully registered' });
        } else {
            throw new Error('Failed to save to file');
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/ses/:id', (req, res) => {
    const sesList = readData();
    const filteredList = sesList.filter(s => s.id !== req.params.id);
    
    if (writeData(filteredList)) {
        res.json({ success: true, message: 'SES has been removed' });
    } else {
        res.status(500).json({ success: false, message: 'Deletion error' });
    }
});

app.listen(PORT, () => console.log(`Runs on: http://localhost:${PORT}`));