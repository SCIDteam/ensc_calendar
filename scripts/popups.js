import { aoc_courses, tools_electives } from './courses.js';
import { createOverlay, createCloseButton } from './ui-utils.js';

export function openToolsPopup(makeBox) {
  const overlay = createOverlay();

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
  const overlay = createOverlay();

  const popup = document.createElement('div');
  popup.className = 'popup';

  const close = createCloseButton(() => overlay.remove());
  popup.appendChild(close);

  const title = document.createElement('h3');
  title.textContent = aoc_courses[selectedAoc].title;
  popup.appendChild(title);

  renderAocCourses(selectedAoc, popup);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

export function openColumnPopup(col, courses) {
  const overlay = createOverlay();

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

  const close = createCloseButton(() => overlay.remove());
  pop.appendChild(close);

  overlay.appendChild(pop);
  document.body.appendChild(overlay);
}

let compStudyData = null;
let compStudyAreas = [];

export function openCompStudiesPopup() {
  const loadData = compStudyData
    ? Promise.resolve(compStudyData)
    : fetch('json/comp_study_courses.json')
        .then(r => r.json())
        .then(data => {
          compStudyData = data;
          compStudyAreas = [...new Set(data.map(c => c['Complementary Study Area']))];
          return compStudyData;
        });

  loadData
    .then(() => showPopup(compStudyAreas[0]))
    .catch(e => console.error('Error loading complementary studies:', e));

  function showPopup(initialArea) {
    const overlay = createOverlay();

    const popup = document.createElement('div');
    popup.className = 'popup';

    const close = createCloseButton(() => overlay.remove());
    popup.appendChild(close);

    const title = document.createElement('h3');
    title.textContent = 'Complementary Studies Courses';
    popup.appendChild(title);

    const select = document.createElement('select');
    compStudyAreas.forEach(area => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      select.appendChild(opt);
    });
    select.value = initialArea;
    popup.appendChild(select);

    const columns = document.createElement('div');
    columns.className = 'columns-container';
    popup.appendChild(columns);

    const renderArea = area => {
      columns.innerHTML = '';
      const filtered = compStudyData.filter(c => c['Complementary Study Area'] === area);
      const subjects = [...new Set(filtered.map(c => c.Subject))];
      subjects.forEach(sub => {
        const col = document.createElement('div');
        col.className = 'course-column';
        const head = document.createElement('h3');
        head.textContent = sub;
        col.appendChild(head);
        filtered.filter(c => c.Subject === sub).forEach(course => {
          const box = document.createElement('div');
          box.className = 'course-box';
          const t = document.createElement('div');
          t.className = 'course-title';
          t.textContent = `${course['Course Code']} - ${course['Course Title']}`;
          const d = document.createElement('div');
          d.className = 'course-desc';
          d.textContent = course.Description || '';
          box.appendChild(t);
          box.appendChild(d);
          col.appendChild(box);
        });
        columns.appendChild(col);
      });
    };

    select.addEventListener('change', () => renderArea(select.value));
    renderArea(initialArea);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }
}