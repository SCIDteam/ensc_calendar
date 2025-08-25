import { calendar_courses, aoc_courses, yearMapping, tools_electives } from './courses.js';
import { openToolsPopup, openAocPopup, openCompStudiesPopup, openColumnPopup } from './popups.js';
import { areaDescriptions } from './text_content.js'; 

const $ = id => document.getElementById(id);

// Element for calendar view
const courseGrid = $("courseGrid");

const normalise = c => c.replace(/_V/, '').trim();
const wantedCodes = new Map(
  Object.values(calendar_courses)
    .flat()
    .flatMap(i => (Array.isArray(i) ? i : [i]))
    .filter(c => /^[A-Z]{4}(?:_V)? \d{3}$/.test(c.trim()))
    .map(c => [normalise(c), c.trim()])
);
tools_electives.forEach(c => {
  const norm = normalise(c);
  if (!wantedCodes.has(norm)) wantedCodes.set(norm, c);
});
const courses = {};

function updateCourse({ course_code, course_title = '', description = '', prerequisites = [], corequisites = [] }) {
  const norm = normalise(course_code);
  if (!wantedCodes.has(norm)) return;
  const key = wantedCodes.get(norm);
  const c = courses[key] || (courses[key] = { code: course_code, title: '', desc: '', prereqs: [], coreqs: [] });
  if (!c.title && course_title) c.title = course_title;
  if (!c.desc && description) c.desc = description;
  if (!c.prereqs.length && Array.isArray(prerequisites) && prerequisites.length) c.prereqs = prerequisites;
  if (!c.coreqs.length && Array.isArray(corequisites) && corequisites.length) c.coreqs = corequisites;
}

Promise.all([
  fetch('json/envr_major_core.json').then(r => r.json()),
  fetch('json/new_courses_info.json').then(r => r.json()),
  fetch('json/tools_electives.json').then(r => r.json())
])
  .then(([core, info, tools]) => {
    core.forEach(updateCourse);
    info.forEach(updateCourse);
    tools.forEach(t =>
      updateCourse({
        course_code: t.Course_Code,
        course_title: t['Course Title'],
        description: t.Description
      })
    );
    renderCalendar();
  })
  .catch(e => console.error('Error loading courses:', e));

function renderCalendar() {
  courseGrid.innerHTML = '';

  const prereqSnippet = txt => {
    const i = txt.search(/Prerequisite|Not Open/i);
    return i >= 0 ? txt.slice(i) : '';
  };

  const makeBox = code => {
    const data = courses[code] || { code };
    const box = document.createElement('div');
    box.className = 'course-box';
    box.dataset.code = code;
    box.innerHTML = `<div class="course-title">${data.code}${data.title ? ' – ' + data.title : ''}</div>` +
                    `<div class="course-desc">${prereqSnippet(data.desc || '')}</div>`;
    return box;
  };

  yearMapping.forEach(({ key, label }) => {
    const raw = calendar_courses[key] || [];
    const col = document.createElement('div');
    col.className = 'course-column';
    col.innerHTML =
      `<div class="column-header"><h3>${label}</h3><button class="expand-btn" title="Expand">&#x26F6;</button></div>`;

    raw.forEach(item => {
      if (Array.isArray(item)) {
        const group = document.createElement('div');
        group.className = 'choice-group';
        group.innerHTML = '<div class="choice-label">Choose one of:</div>';

        item.forEach(c => {
          const b = makeBox(c);
          if (b) group.appendChild(b);
        });

        if (group.querySelector('.course-box')) col.appendChild(group);
      }
      
      else if (typeof item === 'string' && item.includes('Tools Elective')) {
        const b = document.createElement('div');
        b.className = 'course-box';
        b.dataset.code = 'TOOLS_ELECTIVE';
        b.innerHTML = '<div class="course-title">Tools Elective</div><div class="course-desc">Click to see more information.</div>';
        b.addEventListener('click', () => openToolsPopup(makeBox, courses));
        col.appendChild(b);
      }
      
      else if (typeof item === 'string' && item.includes('Complementary Studies')) {
        const b = document.createElement('div');
        b.className = 'course-box';
        b.dataset.code = 'COMP_STUDIES';
        b.innerHTML = `<div class="course-title">${item}</div><div class="course-desc">Click to view courses.</div>`;
        b.addEventListener('click', () => openCompStudiesPopup());
        col.appendChild(b);
      }
      
      else if (typeof item === 'string' && item.includes('Area of Concentration')) {
        const b = document.createElement('div');
        b.className = 'course-box';
        b.dataset.code = 'AOC_REQUIREMENT';
        b.innerHTML = `<div class="course-title">${item}</div><div class="course-desc">Click to view requirements.</div>`;
        b.addEventListener('click', () => openAocPopup(selectedAoc, renderAocCourses));
        col.appendChild(b);
      }
      
      else {
        const b = makeBox(item);
        if (b) col.appendChild(b);
      }

    });

    col.querySelector('.expand-btn').addEventListener('click', () => openColumnPopup(col, courses));
    courseGrid.appendChild(col);

  });
}

let selectedAoc = null;
let aocCourseDescriptions = {};

fetch('json/aoc_courses.json')
  .then(response => response.json())
  .then(data => {
    aocCourseDescriptions = data.reduce((acc, course) => {
      acc[course.course_code] = {
        title: course.course_title,
        desc: course.course_desc
      };
      return acc;
    }, {});
  })
  .catch(error => console.error('Error loading course descriptions:', error));

function renderAocCourses(key, container) {
  if (!container) {
    console.error('No container provided for AOC courses');
    return;
  }

  // Clear the container completely (no need to preserve close button here)
  container.innerHTML = '';
  
  const area = aoc_courses[key];

  const title = document.createElement('h3');
  title.textContent = area.title;
  // container.appendChild(title);

  const subtitle = document.createElement('div')
  subtitle.innerHTML = areaDescriptions[area.title].html
  container.appendChild(subtitle)

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'columns-container';

  const createColumn = (titleText, content, sortByCourseNumber = false) => {
    const col = document.createElement('div');
    col.className = 'course-column';

    const heading = document.createElement('h3');
    heading.textContent = titleText;
    col.appendChild(heading);

    let courses = content.flat();
    
    if (sortByCourseNumber) {
      courses = courses.sort((a, b) => {
        const numA = parseInt(a.slice(-3));
        const numB = parseInt(b.slice(-3));
        return numA - numB;
      });
    }

    courses.forEach(course => {
      const box = document.createElement('div');
      box.className = 'course-box';

      const titleEl = document.createElement('div');
      titleEl.className = 'course-title';
      const courseData = aocCourseDescriptions[course];

      titleEl.textContent = courseData ? `${course} - ${courseData.title}` : course;

      const descEl = document.createElement('div');
      descEl.className = 'course-desc';
      descEl.textContent = courseData ? courseData.desc : 'Description not available.';

      box.appendChild(titleEl);
      box.appendChild(descEl);
      col.appendChild(box);
    });

    return col;
  };

  if (area.required?.length > 0)
    columnsContainer.appendChild(createColumn('Required Courses', area.required, true));

  if (Array.isArray(area.oneOf))
    area.oneOf.forEach(group => {
      columnsContainer.appendChild(createColumn('Choose One of the Following', [group]));
    });

  if (Array.isArray(area.threeOf) && area.threeOf.length > 0)
    columnsContainer.appendChild(createColumn('Choose Three of the Following', area.threeOf));

  if (Array.isArray(area.fourOf) && area.fourOf.length > 0)
    columnsContainer.appendChild(createColumn('Choose Four of the Following', area.fourOf));

  if (columnsContainer.children.length > 0) {
    container.appendChild(columnsContainer);
  }
}
