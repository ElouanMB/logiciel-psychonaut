const notyf = new Notyf({ duration: 4000, position: { x: 'right', y: 'top' } });

const profileSection = document.getElementById('profile-section');
const configForm = document.getElementById('config-form');
const configStatus = document.getElementById('config-status');
const btnSave = document.getElementById('btn-save');
const btnLogout = document.getElementById('btn-logout');
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

// Toggle password visibility
togglePassword.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.style.display = 'none';
    eyeOffIcon.style.display = 'block';
  } else {
    passwordInput.type = 'password';
    eyeIcon.style.display = 'block';
    eyeOffIcon.style.display = 'none';
  }
});

// Charger la config actuelle et vérifier le profil
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.username && data.password && data.password !== '') {
        // Try to verify login
        await verifyLogin();
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Vérifier la connexion et récupérer le profil
async function verifyLogin() {
  try {
    const res = await fetch('/api/verify-login');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.profile) {
        showProfile(data.profile);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Afficher le profil
function showProfile(profile) {
  document.getElementById('profile-username').textContent = profile.username;
  document.getElementById('profile-avatar').src = profile.avatar || '/ressources/logo.svg';
  profileSection.classList.remove('hidden');
  configForm.classList.add('hidden');
  configStatus.innerHTML = '';
}

// Masquer le profil et afficher le formulaire
function hideProfile() {
  profileSection.classList.add('hidden');
  configForm.classList.remove('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// Sauvegarder la config et vérifier
configForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  btnSave.disabled = true;
  btnSave.textContent = 'Vérification...';
  configStatus.innerHTML = '<div class="status info">⏳ Connexion en cours...</div>';

  try {
    // Save config
    const saveRes = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!saveRes.ok) {
      throw new Error('Erreur de sauvegarde');
    }

    // Verify login
    const verifyRes = await fetch('/api/verify-login');
    const verifyData = await verifyRes.json();

    if (verifyRes.ok && verifyData.ok && verifyData.profile) {
      notyf.success('Connexion réussie !');
      showProfile(verifyData.profile);
    } else {
      throw new Error(verifyData.error || 'Échec de connexion');
    }
  } catch (err) {
    notyf.error('Erreur : ' + err.message);
    configStatus.innerHTML = '<div class="status error">✗ ' + err.message + '</div>';
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Enregistrer et vérifier';
  }
});

// Déconnexion
btnLogout.addEventListener('click', () => {
  hideProfile();
});

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-icon-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    const configLink = document.getElementById('config-link');
    if (configLink) {
        configLink.classList.add('active');
    }

    loadConfig();
    
    // Setup update button
    const btnUpdate = document.getElementById('btn-update');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', handleUpdate);
    }
});

// Handle git pull update
async function handleUpdate() {
    const updateSection = document.getElementById('update-section');
    const updateStatus = document.getElementById('update-status');
    const progressFill = document.getElementById('progress-fill');
    const updateLog = document.getElementById('update-log');
    const btnUpdate = document.getElementById('btn-update');
    
    // Show update section
    updateSection.classList.remove('hidden');
    btnUpdate.disabled = true;
    
    // Reset progress
    progressFill.style.width = '0%';
    updateLog.innerHTML = '';
    updateStatus.textContent = 'Initialisation de la mise à jour...';
    
    try {
        // Step 1: Check git status
        progressFill.style.width = '20%';
        addLog('Vérification du repository Git...', 'info');
        
        const response = await fetch('/api/update', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        // Read stream
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                try {
                    const data = JSON.parse(line);
                    
                    if (data.progress) {
                        progressFill.style.width = data.progress + '%';
                    }
                    
                    if (data.status) {
                        updateStatus.textContent = data.status;
                    }
                    
                    if (data.log) {
                        addLog(data.log, data.type || 'info');
                    }
                    
                    if (data.success) {
                        updateStatus.textContent = '✓ Mise à jour terminée avec succès !';
                        progressFill.style.width = '100%';
                        notyf.success('Code mis à jour avec succès !');
                        
                        // Ask to reload
                        setTimeout(() => {
                            if (confirm('Mise à jour terminée ! Recharger la page pour appliquer les changements ?')) {
                                window.location.reload();
                            }
                        }, 1000);
                    }
                    
                    if (data.error) {
                        throw new Error(data.error);
                    }
                } catch (e) {
                    console.error('Parse error:', e, line);
                }
            }
        }
        
    } catch (error) {
        console.error('Update error:', error);
        updateStatus.textContent = '✗ Erreur lors de la mise à jour';
        addLog('Erreur: ' + error.message, 'error');
        progressFill.style.width = '100%';
        progressFill.style.background = 'var(--danger)';
        notyf.error('Échec de la mise à jour: ' + error.message);
    } finally {
        btnUpdate.disabled = false;
        feather.replace();
    }
}

function addLog(message, type = 'info') {
    const updateLog = document.getElementById('update-log');
    const logLine = document.createElement('div');
    logLine.className = `log-line log-${type}`;
    logLine.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    updateLog.appendChild(logLine);
    updateLog.scrollTop = updateLog.scrollHeight;
}
