import _, { bind } from 'lodash';
import {publish, subscribe} from './pubsub.js'
import {createDOM, appendDOMs} from './functionsDOM'

function Project(id, name) {
    let tasks = [];
    let isSelected = false;

    this.getId = function () {
        return id;
    };
    this.getName = function () {
        return name;
    };

    this.getTasks = function () {
        return tasks;
    };

    this.addTask = function (task) {
        tasks.push(task);
        ///////////////////////////////////// HERE
        let project = projects.filter(x => x.getName() == task.getProject())[0];
        publish("renderTaskView", project);
        const countTasks = projects.reduce((sum, project) => sum + project.getTasks().filter(x => !x.getIsDone()).length, 0);
        publish("renderCounterView", countTasks);
        document.querySelector('.textArea').value = "";
        const modals = document.querySelectorAll(".modal");
        modals.forEach((modal) => {
            modal.style.display = "none";
        });
    };

    this.getIsSelected = function () {
        return isSelected;
    };

    this.setIsSelected = function (val) {
        isSelected = val;
    };
}

/*const tasks = [
    new Task("task1", "Learning about Factory Functions", "14/09/21", "All tasks", false),
    new Task("task2", "Practice with Module Pattern", null, "All tasks", true),
    new Task("task3", "Continue with The Odin Project", null, "All tasks", false)];*/

const projects = [new Project("project1", "All tasks"), new Project("project2", "Today")];

/*projects.forEach(function (project) {
    if (project.getId() == "project1") {
        tasks.forEach(function (task) {
            project.addTask(task);
        });
    }
});*/

var projectView = (function () {
    function onProjectSelected(id) {
        var project = projects.filter(x => x.getId() == id)[0];
        if (project.getIsSelected()) {
            return;
        } else {
            projects.forEach(function (project) {
                project.setIsSelected(false);
            });
            project.setIsSelected(true);
        }
        publish("renderTaskView", project);
        publish("renderProjectView", projects);
        const countTasks = projects.reduce((sum, project) => sum + project.getTasks().filter(x => !x.getIsDone()).length, 0);
        publish("renderCounterView", countTasks);
    }

    subscribe("renderProjectView", function (eventArgs) {
        const listProjectDom = document.querySelector('.options');
        listProjectDom.textContent = "";
        eventArgs.forEach(function (project) {
            const button = createDOM("button", project.getIsSelected() ? { "id": project.getId(), "class": "option selected", "textContent": project.getName() } : { "id": project.getId(), "class": "option", "textContent": project.getName() });
            button.addEventListener("click", (e) => {
                onProjectSelected(e.target.id);
            });
            listProjectDom.appendChild(button);
        });
        const modalProject = document.getElementById("myModalProject");
        const btnProject = document.querySelector('.addProject');
        btnProject.addEventListener("click", (e) => {
            modalProject.style.display = "block";
        });
    });

    return { onProjectSelected };
})();


function Task(id, description, time, project, isDone) {
    this.getId = function () {
        return id;
    };
    this.getDescription = function () {
        return description;
    };
    this.getTime = function () {
        return time;
    };
    this.getProject = function () {
        return project;
    };
    this.getIsDone = function () {
        return isDone;
    };
    this.setIsDone = function (val) {
        isDone = val;
        let project = projects.filter(x => x.getName() == this.getProject())[0];
        publish("renderTaskView", project);
        const countTasks = projects.reduce((sum, project) => sum + project.getTasks().filter(x => !x.getIsDone()).length, 0);
        publish("renderCounterView", countTasks);
    };
}

const taskView = (function () {
    function onTaskSelected(id) {
        let project = projects.filter(x => x.getIsSelected())[0];
        let task = project.getTasks().filter(x => x.getId() == id)[0];
        publish("taskSelected", task);
    }

    function onTaskSend(projectName, textTask) {
        let project = projects.filter(x => x.getName() == projectName)[0];
        let newTask = new Task(`task${project.getTasks().length}`, textTask, null, project.getName(), false);
        publish("taskSent", newTask);
    }

    subscribe("renderTaskView", function (eventArgs) {
        const listTaskDom = document.querySelector('.list-tasks');
        listTaskDom.textContent = "";
        const projectTitle = document.querySelector('.project-title');
        projectTitle.textContent = eventArgs.getName();
        eventArgs.getTasks().forEach(function (task) {
            const label = createDOM("label", task.getIsDone() ? { "for": task.getId(), "class": "done" } : { "for": task.getId() });
            const input = createDOM("input", task.getIsDone() ? { "id": task.getId(), "type": "checkbox", "checked": "true", "name": "task" } : { "id": task.getId(), "type": "checkbox", "name": "task" });
            input.addEventListener("click", (e) => {
                onTaskSelected(e.target.id);
            });
            const spanTime = createDOM("span", { "class": "material-icons md-14", "textContent": "alarm" });
            const text = createDOM("text", task.getDescription());
            const labelTime = createDOM("label", { "class": "time-task", "textContent": task.getTime() });
            const deleteBtn = createDOM("button", { "class": "deleteBtn" });
            const editBtn = createDOM("button", { "class": "editBtn" });
            const deleteLogo = createDOM("span", { "class": "material-icons md-14", "textContent": "clear" });
            const editLogo = createDOM("span", { "class": "material-icons md-14", "textContent": "edit" });
            if (!(task.getTime() == null)) {
                appendDOMs(label, [input, spanTime, text, labelTime, appendDOMs(deleteBtn, [deleteLogo]), appendDOMs(editBtn, [editLogo])]);
            } else {
                appendDOMs(label, [input, text, appendDOMs(deleteBtn, [deleteLogo]), appendDOMs(editBtn, [editLogo])]);
            }
            listTaskDom.append(label);
        });
        const modalTask = document.getElementById("myModalTask");
        const btnTask = document.querySelector('.new-task');
        const projectNewTask = document.querySelector('.SelectProject');
        btnTask.addEventListener("click", (e) => {
            modalTask.style.display = "block";
            projectNewTask.value = eventArgs.getName();
            projectNewTask.disabled = true;
        });


    });

    return { onTaskSend };
})();

const taskController = (function () {
    subscribe("taskSelected", function (eventArgs) {
        eventArgs.setIsDone(!eventArgs.getIsDone());
    });
    subscribe("taskSent", function (eventArgs) {
        let project = projects.filter(x => x.getName() == eventArgs.getProject())[0];
        project.addTask(eventArgs);
    });
})();

const counterView = (function () {
    subscribe("renderCounterView", function (eventArgs) {
        const listTaskDom = document.querySelector('.task-elements');
        listTaskDom.textContent = eventArgs;
    });
})();

projectView.onProjectSelected("project1");

const projectNewTask = document.querySelector('.SelectProject');
const btnSubmitTask = document.querySelector('#submitTask');
btnSubmitTask.addEventListener("click", (e) => {
    taskView.onTaskSend(projectNewTask.value, document.querySelector('.textArea').value);
});

window.onclick = function (event) {
    if (event.target.classList.contains("modal") || event.target.classList.contains("close")) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach((modal) => {
            modal.style.display = "none";
        });
    }
}

