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

loadConfig();
