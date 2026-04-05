const form = document.getElementById('sesForm');
const messageDiv = document.getElementById('message');
const sesListDiv = document.getElementById('sesList');
const filterType = document.getElementById('filterType');

const panelPowerInput = document.getElementById('panelPower');
const panelCountInput = document.getElementById('panelCount');
const totalPowerInput = document.getElementById('totalPower');

const hasBatteryCheckbox = document.getElementById('hasBattery');
const batteryCapacityGroup = document.getElementById('batteryCapacityGroup');
const batteryCapacityInput = document.getElementById('batteryCapacity');

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadStats();
});

function calculatePower() {
    const power = parseFloat(panelPowerInput.value) || 0;
    const count = parseInt(panelCountInput.value) || 0;
    const totalKW = (power * count) / 1000;
    totalPowerInput.value = totalKW.toFixed(2);
}
panelPowerInput.addEventListener('input', calculatePower);
panelCountInput.addEventListener('input', calculatePower);

hasBatteryCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        batteryCapacityGroup.classList.remove('hidden');
        batteryCapacityInput.required = true;
    } else {
        batteryCapacityGroup.classList.add('hidden');
        batteryCapacityInput.required = false;
        batteryCapacityInput.value = '';
    }
});

filterType.addEventListener('change', loadData);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    calculatePower(); 

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/ses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (result.success) {
            showMessage('success', result.message);
            form.reset();
            calculatePower(); 
            hasBatteryCheckbox.dispatchEvent(new Event('change')); 
            loadData();
            loadStats();
        } else {
            showMessage('error', result.message);
        }
    } catch (error) {
        showMessage('error', 'Server error');
    }
});

async function loadData() {
    const type = filterType.value;
    const response = await fetch(`/api/ses?type=${type}`);
    const data = await response.json();
    renderList(data);
}

async function loadStats() {
    const response = await fetch('/api/ses/stats');
    const stats = await response.json();
    document.getElementById('statCount').textContent = stats.totalCount;
    document.getElementById('statPower').textContent = stats.totalPower;
    document.getElementById('statBattery').textContent = stats.withBatteries;
}

function renderList(list) {
    if (list.length === 0) {
        sesListDiv.innerHTML = '<p class="empty-state">СЕС не знайдено</p>';
        return;
    }

    const typeNames = { house: 'Будинок', cottage: 'Дача', business: 'Бізнес' };

    sesListDiv.innerHTML = list.map(ses => `
        <div class="card">
            <div class="card-header">
                <h3>${ses.owner}</h3>
                <span class="badge badge-type">${typeNames[ses.objectType]}</span>
            </div>
            <div class="card-body">
                <p>📍 ${ses.address}</p>
                <p>⚡ Потужність: <strong>${ses.totalPower} кВт</strong> (${ses.panelCount} шт x ${ses.panelPower} Вт)</p>
                <p>🔋 Акумулятори: ${ses.hasBattery ? `Так (${ses.batteryCapacity} кВт·год)` : 'Ні'}</p>
                <p>🔳 Тип панелі: ${ses.panelType}</p>
            </div>
            <button onclick="deleteSES('${ses.id}')" class="btn btn-delete">Видалити</button>
        </div>
    `).join('');
}

async function deleteSES(id) {
    if (!confirm('Видалити цей запис?')) return;
    await fetch(`/api/ses/${id}`, { method: 'DELETE' });
    loadData();
    loadStats();
}

function showMessage(type, text) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => messageDiv.style.display = 'none', 3000);
}