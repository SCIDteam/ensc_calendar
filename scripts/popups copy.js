import { aoc_courses, tools_electives, hgseOnline } from './honours_courses.js';
import { createOverlay, createCloseButton } from './ui-utils.js';
import { comp_main_para, bp1, bp2 } from './text_content.js';

export function openToolsPopup(makeBox, courses) {
  const overlay = createOverlay();

  const popup = document.createElement('div');
  popup.className = 'popup';
  
  const title = document.createElement('h3');
  title.textContent = 'Tools Electives';
  popup.appendChild(title);

  const close = createCloseButton(() => overlay.remove());
  popup.appendChild(close);

  const desc = document.createElement('p');
  desc.textContent = "Students should complete a total of 6 credits of 'Tools' electives. Consult credit exclusion list before choosing 'Tools'.";
  popup.appendChild(desc);

  tools_electives.forEach(c => {
    const box = makeBox(c);
    const data = courses[c] || {};
    const descEl = box.querySelector('.course-desc');
    if (descEl) descEl.textContent = data.desc || '';
    popup.appendChild(box);
  });

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

export function openAocPopup(selectedAoc, renderAocCourses) {
  const overlay = createOverlay();

  const popup = document.createElement('div');
  popup.className = 'popup';

  const close = createCloseButton(() => overlay.remove());
  popup.appendChild(close);

  let heading = document.createElement('h3');
  heading.textContent = 'Select an Area of Concentration to View Courses';
  popup.append(heading)

  // Create buttons container inside the popup
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'aoc-buttons';

  // Render buttons inside the popup
  Object.entries(aoc_courses).forEach(([key, area]) => {
    const btn = document.createElement('button');
    btn.className = 'aoc-button';
    btn.innerText = area.title;
    
    btn.onclick = () => {
      const isActive = btn.classList.contains('active');
      // Remove active class from all buttons in the popup
      buttonsContainer.querySelectorAll('.aoc-button').forEach(b => b.classList.remove('active'));

      if (isActive) {
        selectedAoc = null;
        // Clear the courses display
        const existingCoursesContainer = popup.querySelector('.courses-container');
        if (existingCoursesContainer) {
          existingCoursesContainer.remove();
        }
        heading.textContent = 'Select an Area of Concentration to View Courses';
      } else {
        btn.classList.add('active');
        selectedAoc = key;
        heading.textContent = null;
        
        // Remove existing courses container if it exists
        const existingCoursesContainer = popup.querySelector('.courses-container');
        if (existingCoursesContainer) {
          existingCoursesContainer.remove();
        }
        
        // Create new courses container
        const coursesContainer = document.createElement('div');
        coursesContainer.className = 'courses-container';
        
        // Render courses for the selected AOC
        renderAocCourses(key, coursesContainer);
        popup.appendChild(coursesContainer);
      }
    };
    buttonsContainer.appendChild(btn);
  });

  popup.appendChild(buttonsContainer);

  // If there's a selectedAoc, render its courses initially
  if (selectedAoc) {
    const coursesContainer = document.createElement('div');
    coursesContainer.className = 'courses-container';
    renderAocCourses(selectedAoc, coursesContainer);
    popup.appendChild(coursesContainer);
  }

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

export function openColumnPopup(col, courses) {
  const overlay = createOverlay();

  const pop = document.createElement('div');
  pop.className = 'course-column';
  pop.innerHTML = col.innerHTML;

  // Remove the expand-btn from the column-header and replace with close-btn
  const columnHeader = pop.querySelector('.column-header');
  const expandBtn = columnHeader.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.remove();
  }

  // Create and add close button to the column header
  const close = createCloseButton(() => overlay.remove());
  columnHeader.appendChild(close);

  pop.querySelectorAll('.course-box').forEach(box => {
    const code = box.dataset.code;
    if (code === 'TOOLS_ELECTIVE' || code === 'AOC_REQUIREMENT' || code === 'COMP_STUDIES') {
      box.querySelector('.course-desc').textContent = `Close this popup and click on the box from the `;
      return
    };
    const c = courses[code] || {};
    box.querySelector('.course-title').textContent =
      `${c.code || code}${c.title ? ' - ' + c.title : ''}`;
    box.querySelector('.course-desc').textContent = c.desc || '';
  });

  // Add the popup to the overlay
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

    const subtitle = document.createElement('p')
    subtitle.textContent = comp_main_para
    popup.appendChild(subtitle)

    const bullet_points = document.createElement('ol')
    popup.appendChild(bullet_points)

    const bullet_1 = document.createElement('li')
    bullet_1.innerHTML = bp1
    bullet_points.appendChild(bullet_1)

    const bullet_2 = document.createElement('li')
    bullet_2.innerHTML = bp2
    bullet_points.appendChild(bullet_2)

    const selectWrapper = document.createElement('div');
    selectWrapper.className = 'select-legend-wrapper';

    const select = document.createElement('select');
    compStudyAreas.forEach(area => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      select.appendChild(opt);
    });
    select.value = initialArea;

    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = `
      <span class="legend-color"></span>
      Online Courses
      <span class="legend-color-2" style="margin-left: 1em;"></span>
      Field Courses
    `;
    legend.style.display = (initialArea === 'Indigenous Knowledge & Perspectives') ? 'flex' : 'none';

    selectWrapper.appendChild(select);
    selectWrapper.appendChild(legend);
    popup.appendChild(selectWrapper);

    select.addEventListener('change', () => {
      renderArea(select.value);
      if (select.value === 'Indigenous Knowledge & Perspectives') {
        legend.style.display = 'flex';
      } else {
        legend.style.display = 'none';
      }
    });

    const columns = document.createElement('div');
    columns.className = 'columns-container';
    popup.appendChild(columns);

    const renderArea = area => {
      columns.innerHTML = '';
      const filtered = compStudyData.filter(c => c['Complementary Study Area'] === area);
      const subjects = [...new Set(filtered.map(c => c.Subject))];
      subjects.forEach(sub => {
        const col = document.createElement('div');
        col.className = 'course-column-1';
        const head = document.createElement('h3');
        head.textContent = sub;
        col.appendChild(head);
        filtered.filter(c => c.Subject === sub).forEach(course => {
          const box = document.createElement('div');
          box.className = 'course-box';
          
          // Check if this is Haida Gwaii Semesters and if course is in hgseOnline array
          if (sub === "Haida Gwaii Semesters") {
            // Convert course code from "HGSE_V 312" format to "HGSE 312" format for comparison
            const courseCodeForComparison = course['Course Code'].replace('_V', '');
            if (hgseOnline.includes(courseCodeForComparison)) {
              box.style.backgroundColor = '#F5F5DC'; // Light beige color
            }
          }
          
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
