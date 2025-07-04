import { aoc_courses, tools_electives } from './courses.js';

export function openToolsPopup(makeBox) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.addEventListener('click', e => e.target === overlay && overlay.remove());

  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `<p>Students should choose one of the following tools electives and it must be completed before 4th year.</p>`;
  tools_electives.forEach(c => popup.appendChild(makeBox(c, 'popup-box')));

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

export function openAocPopup(selectedAoc, renderAocCourses) {
  if (!selectedAoc) {
    alert('Please select an area of concentration.');
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';
  overlay.addEventListener('click', e => e.target === overlay && overlay.remove());

  const popup = document.createElement('div');
  popup.className = 'popup';

  const close = document.createElement('button');
  close.className = 'close-btn';
  close.innerHTML = '✕';
  close.addEventListener('click', () => overlay.remove());
  popup.appendChild(close);

  const title = document.createElement('h3');
  title.textContent = aoc_courses[selectedAoc].title;
  popup.appendChild(title);

  renderAocCourses(selectedAoc, popup);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

export function openColumnPopup(col, courses) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-overlay';

  const pop = document.createElement('div');
  pop.className = 'popup course-column';
  pop.innerHTML = col.innerHTML;

  pop.querySelectorAll('.course-box').forEach(box => {
    const code = box.dataset.code;
    if (code === 'TOOLS_ELECTIVE' || code === 'AOC_REQUIREMENT') return;
    const c = courses[code] || {};
    box.querySelector('.course-title').textContent =
      `${c.code || code}${c.title ? ' – ' + c.title : ''}`;
    box.querySelector('.course-desc').textContent = c.desc || '';
  });

  const close = document.createElement('button');
  close.className = 'close-btn';
  close.innerHTML = '✕';
  close.addEventListener('click', () => document.body.removeChild(overlay));
  pop.appendChild(close);

  overlay.appendChild(pop);
  document.body.appendChild(overlay);
}