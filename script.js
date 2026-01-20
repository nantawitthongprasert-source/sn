// Local Storage for data persistence
let currentRecords = [];
let currentTab = 'form';
let currentPhotoData = '';

// Initialize app
function initializeApp() {
  loadDataFromStorage();
  setupEventListeners();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('leave-date').value = today;
  
  updateHistoryView();
  updateCheckView();
}

// Load data from localStorage
function loadDataFromStorage() {
  const stored = localStorage.getItem('studentLeaveRecords');
  if (stored) {
    try {
      currentRecords = JSON.parse(stored);
    } catch (e) {
      currentRecords = [];
    }
  }
}

// Save data to localStorage
function saveDataToStorage() {
  localStorage.setItem('studentLeaveRecords', JSON.stringify(currentRecords));
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('leave-form').addEventListener('submit', handleSubmit);
  document.getElementById('new-record-btn').addEventListener('click', resetForm);

  document.getElementById('tab-form').addEventListener('click', () => switchTab('form'));
  document.getElementById('tab-history').addEventListener('click', () => switchTab('history'));
  document.getElementById('tab-check').addEventListener('click', () => switchTab('check'));

  document.getElementById('search-input').addEventListener('input', updateHistoryView);
  document.getElementById('export-btn').addEventListener('click', exportData);

  document.getElementById('parent-photo').addEventListener('change', handlePhotoUpload);
  document.getElementById('remove-photo').addEventListener('click', removePhoto);
  
  document.getElementById('close-modal').addEventListener('click', closePhotoModal);
  document.getElementById('photo-modal').addEventListener('click', (e) => {
    if (e.target.id === 'photo-modal') closePhotoModal();
  });
}

// Switch tabs
function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('tab-active');
  });
  
  if (tab === 'form') {
    document.getElementById('tab-form').classList.add('tab-active');
    document.getElementById('section-form').classList.remove('hidden');
    document.getElementById('section-history').classList.add('hidden');
    document.getElementById('section-check').classList.add('hidden');
  } else if (tab === 'history') {
    document.getElementById('tab-history').classList.add('tab-active');
    document.getElementById('section-form').classList.add('hidden');
    document.getElementById('section-history').classList.remove('hidden');
    document.getElementById('section-check').classList.add('hidden');
    updateHistoryView();
  } else if (tab === 'check') {
    document.getElementById('tab-check').classList.add('tab-active');
    document.getElementById('section-form').classList.add('hidden');
    document.getElementById('section-history').classList.add('hidden');
    document.getElementById('section-check').classList.remove('hidden');
    updateCheckView();
  }
}

// Update date and time
function updateDateTime() {
  const now = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  
  document.getElementById('current-date').textContent = now.toLocaleDateString('th-TH', dateOptions);
  document.getElementById('current-time').textContent = now.toLocaleTimeString('th-TH', timeOptions);
}

// Handle photo upload
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('ไฟล์รูปภาพใหญ่เกินไป (เกิน 5MB)', 'error');
    e.target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูป��าพ���ท���านั้น', 'error');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    currentPhotoData = event.target.result;
    document.getElementById('preview-image').src = currentPhotoData;
    document.getElementById('photo-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// Remove photo
function removePhoto() {
  currentPhotoData = '';
  document.getElementById('parent-photo').value = '';
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('preview-image').src = '';
}

// Open photo modal
function openPhotoModal(photoData) {
  document.getElementById('modal-image').src = photoData;
  document.getElementById('photo-modal').classList.remove('hidden');
}

// Close photo modal
function closePhotoModal() {
  document.getElementById('photo-modal').classList.add('hidden');
}

// Handle form submit
function handleSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const loadingSpinner = document.getElementById('loading-spinner');

  submitBtn.disabled = true;
  submitText.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');

  // Simulate async operation
  setTimeout(() => {
    const recordId = 'LA' + Date.now().toString().slice(-8);
    const studentName = document.getElementById('student-name').value;
    const studentId = document.getElementById('student-id').value;
    const grade = document.getElementById('grade').value;
    const room = document.getElementById('room').value;
    const timeOut = document.getElementById('time-out').value;

    const formData = {
      record_id: recordId,
      student_name: studentName,
      student_id: studentId,
      grade: grade,
      room: room,
      leave_date: document.getElementById('leave-date').value,
      time_out: timeOut,
      reason: document.getElementById('reason').value,
      parent_phone: document.getElementById('parent-phone').value,
      parent_photo: currentPhotoData || '',
      created_at: new Date().toISOString()
    };

    currentRecords.push(formData);
    saveDataToStorage();

    submitBtn.disabled = false;
    submitText.classList.remove('hidden');
    loadingSpinner.classList.add('hidden');

    document.getElementById('display-record-id').textContent = recordId;
    document.getElementById('display-student-info').textContent = `${studentName} (${grade}/${room})`;
    document.getElementById('display-time-info').textContent = `เวลาออก: ${timeOut}`;
    
    document.getElementById('leave-form').classList.add('hidden');
    document.getElementById('success-panel').classList.remove('hidden');
    showToast('บันทึกข้อมูลสำเร็จ', 'success');
  }, 1000);
}

// Reset form
function resetForm() {
  document.getElementById('leave-form').reset();
  removePhoto();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('leave-date').value = today;
  document.getElementById('leave-form').classList.remove('hidden');
  document.getElementById('success-panel').classList.add('hidden');
}

// Update history view
function updateHistoryView() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();

  let filtered = currentRecords.filter(record => {
    const matchName = record.student_name.toLowerCase().includes(searchTerm);
    const matchId = record.student_id.toLowerCase().includes(searchTerm);
    return matchName || matchId;
  });

  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const historyList = document.getElementById('history-list');
  const emptyHistory = document.getElementById('empty-history');
  const historyCount = document.getElementById('history-count');

  historyCount.textContent = filtered.length;

  if (filtered.length === 0) {
    historyList.innerHTML = '';
    emptyHistory.classList.remove('hidden');
  } else {
    emptyHistory.classList.add('hidden');
    historyList.innerHTML = filtered.map(record => createHistoryCard(record)).join('');
    
    filtered.forEach(record => {
      if (record.parent_photo) {
        const photoBtn = document.querySelector(`[data-photo-id="${record.record_id}"]`);
        if (photoBtn) {
          photoBtn.addEventListener('click', () => openPhotoModal(record.parent_photo));
        }
      }
    });
  }
}

// Create history card
function createHistoryCard(record) {
  const date = new Date(record.leave_date);
  const dateStr = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  const photoSection = record.parent_photo ? `
    <div class="mt-4">
      <p class="text-sm text-amber-700 mb-2">รูปภาพผู้ปกครอง:</p>
      <button type="button" data-photo-id="${record.record_id}" class="inline-block">
        <img src="${record.parent_photo}" alt="Parent photo" class="w-32 h-32 object-cover rounded-lg border-2 border-amber-300 hover:opacity-80 transition-all cursor-pointer">
      </button>
    </div>
  ` : '';

  return `
    <div class="p-6 rounded-xl border-2 border-amber-200 bg-white hover:shadow-lg transition-all">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-amber-900">${record.student_name}</h3>
          <p class="text-sm text-amber-700">${record.grade}/${record.room} | เลขประจำตัว: ${record.student_id}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-900">
          ${record.record_id}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4 text-amber-900">
        <div>
          <p class="text-sm text-amber-700">วันที่ลา</p>
          <p class="font-semibold">📅 ${dateStr}</p>
        </div>
        <div>
          <p class="text-sm text-amber-700">เวลาออก</p>
          <p class="font-semibold">🕐 ${record.time_out}</p>
        </div>
      </div>
      <div class="mb-4 text-amber-900">
        <p class="text-sm text-amber-700">เหตุผล</p>
        <p class="font-medium">${record.reason}</p>
      </div>
      <div class="text-sm text-amber-700">
        <p>📞 เบอร์ผู้ปกครอง: ${record.parent_phone}</p>
      </div>
      ${photoSection}
    </div>
  `;
}

// Update check view
function updateCheckView() {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = currentRecords.filter(record => record.leave_date === today);
  
  todayRecords.sort((a, b) => a.time_out.localeCompare(b.time_out));

  const checkTable = document.getElementById('check-table');
  const emptyCheck = document.getElementById('empty-check');
  const todayCount = document.getElementById('today-count');

  todayCount.textContent = todayRecords.length;

  if (todayRecords.length === 0) {
    checkTable.innerHTML = '';
    emptyCheck.classList.remove('hidden');
  } else {
    emptyCheck.classList.add('hidden');
    checkTable.innerHTML = todayRecords.map(record => createCheckTableRow(record)).join('');
    
    todayRecords.forEach(record => {
      if (record.parent_photo) {
        const photoBtn = document.querySelector(`[data-table-photo-id="${record.record_id}"]`);
        if (photoBtn) {
          photoBtn.addEventListener('click', () => openPhotoModal(record.parent_photo));
        }
      }
    });
  }
}

// Create check table row
function createCheckTableRow(record) {
  const photoCell = record.parent_photo ? `
    <button type="button" data-table-photo-id="${record.record_id}" class="inline-block">
      <img src="${record.parent_photo}" alt="Photo" class="w-16 h-16 object-cover rounded border border-amber-300 hover:opacity-80 transition-all cursor-pointer">
    </button>
  ` : '<span class="text-sm text-amber-600">ไม่มีรูป</span>';

  return `
    <tr class="border-b border-amber-100 hover:bg-amber-50 text-amber-900">
      <td class="py-3 px-4 font-semibold">${record.time_out}</td>
      <td class="py-3 px-4">${record.student_name}</td>
      <td class="py-3 px-4">${record.grade}/${record.room}</td>
      <td class="py-3 px-4">${record.student_id}</td>
      <td class="py-3 px-4">${record.reason}</td>
      <td class="py-3 px-4">${record.parent_phone}</td>
      <td class="py-3 px-4">${photoCell}</td>
      <td class="py-3 px-4 font-mono text-sm">${record.record_id}</td>
    </tr>
  `;
}

// Export data to CSV
function exportData() {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = currentRecords.filter(record => record.leave_date === today);

  if (todayRecords.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับ Export วันนี้', 'error');
    return;
  }

  const csv = convertToCSV(todayRecords);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `รายชื่อนักเรียนลา_${today}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Export ข้อมูลสำเร็จ', 'success');
}

// Convert to CSV
function convertToCSV(data) {
  const headers = ['เวลา', 'ชื่อ-สกุล', 'ชั้น', 'ห้อง', 'เลขประจำตัว', 'เหตุผล', 'เบอร์ผู้ปกครอง', 'มีรูปภาพ', 'รหัสอ้างอิง'];
  
  const rows = data.map(record => [
    record.time_out,
    record.student_name,
    record.grade,
    record.room,
    record.student_id,
    record.reason,
    record.parent_phone,
    record.parent_photo ? 'มี' : 'ไม่มี',
    record.record_id
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

// Show toast notification
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.backgroundColor = type === 'error' ? '#fee2e2' : '#dcfce7';
  toast.style.color = type === 'error' ? '#991b1b' : '#166534';
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
