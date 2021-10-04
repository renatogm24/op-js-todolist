import _, { bind } from 'lodash';
import { publish, subscribe } from './pubsub'
import { createDOM, appendDOMs } from './functionsDOM'
import { format, compareAsc, parse, isToday } from 'date-fns'

function Project(id, name) {
    let tasks = [];
    let allTasks = [];
    let isSelected = false;
    this.getId = function () {
        return id;
    };
    this.setId = function (val) {
        id = val;
    };
    this.getName = function () {
        return name;
    };
    this.setName = function (val) {
        name = val;
    };
    this.getTasks = function () {
        return tasks;
    };
    this.setTasks = function (val) {
        tasks = val;
    };
    this.getAllTasks = function () {
        return allTasks;
    };
    this.setAllTasks = function (val) {
        allTasks = val;
    };
    this.addTask = function (task) {
        tasks.push(task);
    };
    this.getIsSelected = function () {
        return isSelected;
    };
    this.setIsSelected = function (val) {
        isSelected = val;
    };
}

//Test Tasks
const tasks = [
    new Task("project1_task1", "Learning about Factory Functions", format(new Date(),"dd/MM/yy"), "All tasks", false),
    new Task("project1_task2", "Practice with Module Pattern", null, "All tasks", true),
    new Task("project1_task3", "Continue with The Odin Project", null, "All tasks", false)];

//Init Projects, with first one, selected
const projects = [new Project("project1", "All tasks"), new Project("project2", "Today")];
projects[0].setIsSelected(true);

//Load Test Tasks
projects.forEach(function (project) {
    if (project.getId() == "project1") {
        tasks.forEach(function (task) {
            project.addTask(task);
        });
    }
});


var projectView = (function () {
    function onProjectSelected(id) {
        const project = projects.filter(x => x.getIsSelected())[0];
        if (project.getId() == id) {
            return;
        } else {
            publish("updateSelected", projects.filter(x => x.getId() == id)[0]);
        }
    }

    function onProjectDeleted(id) {
        publish("deleteSelected", projects.filter(x => x.getId() == id)[0]);
    }

    function onProjectEdited(id) {
        publish("editSelected", projects.filter(x => x.getId() == id)[0]);
    }

    subscribe("renderProjectView", function (eventArgs) {
        const listProjectDom = document.querySelector('.options');
        listProjectDom.textContent = "";
        let cont = 1;
        eventArgs.forEach(function (project) {
            if (project.getIsSelected()) {
                publish("projectSelected", project);
            }
            const div = createDOM("div", project.getIsSelected() ? { "id": project.getId(), "class": "option selected" } : { "id": project.getId(), "class": "option" });
            const button = createDOM("button", { "textContent": project.getName(), "class": "projectBtnSelect" });
            button.addEventListener("click", (e) => {
                onProjectSelected(e.target.closest(".option").id);
            });

            if (cont > 2) {
                const deleteBtn = createDOM("button", { "class": "deleteBtnProj" });
                const deleteLogo = createDOM("span", { "class": "material-icons md-12", "textContent": "clear" });
                deleteBtn.addEventListener("click", (e) => {
                    onProjectDeleted(e.target.closest(".option").id);
                });
                const editBtn = createDOM("button", { "class": "editBtnProj" });
                editBtn.addEventListener("click", (e) => {
                    onProjectEdited(e.target.closest(".option").id);
                });
                const editLogo = createDOM("span", { "class": "material-icons md-12", "textContent": "edit" });
                appendDOMs(div, [button, appendDOMs(editBtn, [editLogo]), appendDOMs(deleteBtn, [deleteLogo])]);
            } else {
                appendDOMs(div, [button]);
            }

            cont++;
            listProjectDom.appendChild(div);
        });
    });
})();

const projectController = (function () {
    subscribe("addNewTask", function (newTask) {
        if (newTask.getDescription() == "") {
            return;
        }

        if (newTask.getId() == null) {
            projects.forEach(project => {
                if (project.getName() == newTask.getProject()) {
                    newTask.setId(`${project.getId()}_task${project.getTasks().length + 1}`);
                    project.addTask(newTask);
                    if (project.getIsSelected()) {
                        publish("renderTaskOnProject", project);
                        publish("updateTaskCounter");
                    } else {
                        publish("updateTaskCounter");
                    }
                }
            });
        } else {
            const projectSelected = projects.filter(x => x.getIsSelected())[0];
            projects.forEach(project => {
                if (project.getName() == newTask.getProject()) {
                    const taskToEdit = project.getTasks().filter(x => x.getId() == newTask.getId())[0];
                    taskToEdit.setDescription(newTask.getDescription());
                    taskToEdit.setTime(newTask.getTime());
                    publish("renderTaskOnProject", projectSelected);
                    publish("updateTaskCounter");
                }
            });
        }
    });
    subscribe("addNewProject", function (newProject) {
        if (newProject.getName() == "" || projects.filter(x => x.getName() == newProject.getName()).length > 0) {
            return;
        }

        if (newProject.getId() != null) {
            const projectToUpdate = projects.filter(x => x.getId() == newProject.getId())[0];
            projectToUpdate.setName(newProject.getName());
            projectToUpdate.getTasks().forEach(task => {
                task.setProject(newProject.getName());
            });
        } else {
            newProject.setId(`project${projects.length + 1}`);
            projects.push(newProject);
        }

        publish("renderProjectView", projects);
    });
    subscribe("projectSelected", function (project) {
        publish("renderTaskOnProject", project);
    });
    subscribe("updateSelected", function (eventArgs) {
        const projectSelected = projects.filter(x => x.getIsSelected())[0];
        projectSelected.setIsSelected(false); //Deselect
        eventArgs.setIsSelected(true); //Select
        publish("renderProjectView", projects);
        publish("renderButtonsView", projects);
        if (eventArgs.getName() == "Today") {
            const btnTask = document.querySelector('.new-task');
            btnTask.style.display = "none";
        }
    });
    subscribe("deleteSelected", function (project) {
        let indexToDelete = projects.indexOf(project);
        if (project.getIsSelected()) {
            projects[0].setIsSelected(true);
            publish("renderProjectView", projects);
        }
        projects.splice(indexToDelete, 1);
        publish("renderProjectView", projects);
        publish("updateTaskCounter");
    });
    subscribe("editSelected", function (project) {
        publish("renderEditProject", project);
    });
})();


function Task(id, description, time, project, isDone) {
    this.getId = function () {
        return id;
    };
    this.getDescription = function () {
        return description;
    };
    this.setDescription = function (val) {
        description = val;
    };
    this.getTime = function () {
        return time;
    };
    this.setTime = function (val) {
        time = val;
    };
    this.getProject = function () {
        return project;
    };
    this.setProject = function (val) {
        project = val;
    };
    this.getIsDone = function () {
        return isDone;
    };
    this.setIsDone = function (val) {
        isDone = val;
    };
    this.setId = function (val) {
        id = val;
    };
}

const taskView = (function () {
    function onTaskSelected(id) {
        publish("checkSelectedTask", id);
    }

    function onTaskDeleted(id) {
        publish("deleteSelectedTask", id);
    }

    function onTaskUpdated(id) {
        publish("updateSelectedTask", id);
    }

    subscribe("renderTaskView", function (project) {
        const listTaskDom = document.querySelector('.list-tasks');
        listTaskDom.textContent = "";
        const projectTitle = document.querySelector('.project-title');
        projectTitle.textContent = project.getName();

        const tasks = (project.getId() == "project1" || project.getId() == "project2") ? project.getAllTasks() : project.getTasks();

        tasks.forEach(function (task) {
            const label = createDOM("label", task.getIsDone() ? { "id": task.getId(), "for": `input${task.getId()}`, "class": "done withId" } : { "id": task.getId(), "for": `input${task.getId()}`, "class": "withId" });
            const input = createDOM("input", task.getIsDone() ? { "id": `input${task.getId()}`, "type": "checkbox", "checked": "true", "name": "task" } : { "id": `input${task.getId()}`, "type": "checkbox", "name": "task" });
            input.addEventListener("click", (e) => {
                onTaskSelected(e.target.parentNode.id);
            });
            const spanTime = createDOM("span", { "class": "material-icons md-14", "textContent": "alarm" });
            const text = createDOM("text", task.getDescription());
            const labelTime = createDOM("label", { "class": "time-task", "textContent": task.getTime() });
            const deleteBtn = createDOM("button", { "class": "deleteBtn" });
            deleteBtn.addEventListener("click", (e) => {
                onTaskDeleted(e.target.closest(".withId").id);
            });
            const editBtn = createDOM("button", { "class": "editBtn" });
            editBtn.addEventListener("click", (e) => {
                onTaskUpdated(e.target.closest(".withId").id);
            });
            const deleteLogo = createDOM("span", { "class": "material-icons md-14", "textContent": "clear" });
            const editLogo = createDOM("span", { "class": "material-icons md-14", "textContent": "edit" });
            if (!(task.getTime() == null)) {
                appendDOMs(label, [input, spanTime, text, labelTime, appendDOMs(deleteBtn, [deleteLogo]), appendDOMs(editBtn, [editLogo])]);
            } else {
                appendDOMs(label, [input, text, appendDOMs(deleteBtn, [deleteLogo]), appendDOMs(editBtn, [editLogo])]);
            }
            listTaskDom.append(label);
        });
    });

})();

const taskController = (function () {
    subscribe("renderTaskOnProject", function (project) {
        if (project.getId() == "project1" || project.getId() == "project2") {
            let allTasks = [];
            projects.forEach(project => {
                project.getTasks().forEach(task => {
                    allTasks.push(task);
                });
            });
            if (project.getId() == "project1") {
                project.setAllTasks(allTasks);
            } else if (project.getId() == "project2") {
                const today = format(new Date(), 'dd/MM/yy');
                const todayTasks = allTasks.filter(x => x.getTime() == today);
                project.setAllTasks(todayTasks);
            }
        }
        publish("renderTaskView", project);
    });
    subscribe("checkSelectedTask", function (id) {
        let taskProjectSelect = id.split("_")[0];
        let projectSelected;
        projects.forEach(project => {
            if (project.getIsSelected()) {
                projectSelected = project;
            }

            if (project.getId() == taskProjectSelect) {
                project.getTasks().forEach(task => {
                    if (task.getId() == id) {
                        task.setIsDone(!task.getIsDone());
                    }
                });
            }
        });
        publish("renderTaskView", projectSelected);
        publish("updateTaskCounter");
    });
    subscribe("deleteSelectedTask", function (id) {
        let taskProjectSelect = id.split("_")[0];
        let projectTaskDelete;
        let projectSelected;
        let idxTaskToDelete;
        projects.forEach(project => {
            if (project.getIsSelected()) {
                projectSelected = project;
            }
            if (project.getId() == taskProjectSelect) {
                projectTaskDelete = project;
                project.getTasks().forEach(task => {
                    if (task.getId() == id) {
                        idxTaskToDelete = project.getTasks().indexOf(task);
                    }
                });
            }
        });
        projectTaskDelete.getTasks().splice(idxTaskToDelete, 1);
        publish("renderTaskOnProject", projectSelected);
        publish("updateTaskCounter");
    });
    subscribe("updateSelectedTask", function (id) {
        let taskProjectSelect = id.split("_")[0];
        const projectSelected = projects.filter(x => x.getId() == taskProjectSelect)[0];
        const taskToEdit = projectSelected.getTasks().filter(x => x.getId() == id)[0];
        publish("renderEditTask", taskToEdit);
    });
})();

const counterView = (function () {
    subscribe("renderTaskCounter", function (counter) {
        const listTaskDom = document.querySelector('.task-elements');
        listTaskDom.textContent = counter;
    });
})();

const counterController = (function () {
    subscribe("updateTaskCounter", function () {
        const countTasks = projects.reduce((sum, project) => sum + project.getTasks().filter(x => !x.getIsDone()).length, 0);
        publish("renderTaskCounter", countTasks);
    });
})();

const buttonView = (function () {
    subscribe("renderButtonsView", function (eventArgs) {
        const projectSelected = eventArgs.filter(x => x.getIsSelected())[0];
        const modalTask = document.getElementById("myModalTask");
        const projectNewTask = document.querySelector('.SelectProject');
        const btnTask = document.querySelector('.new-task');
        btnTask.style.display = "block";
        const textArea = document.querySelector('.textArea');
        btnTask.addEventListener("click", (e) => {
            document.getElementById("taskId").value = "";
            document.getElementById("taskTime").value = "";
            modalTask.style.display = "block";
            projectNewTask.value = projectSelected.getName();
            projectNewTask.disabled = true;
            textArea.value = '';
        });
        const newProjectName = document.querySelector('.newProjectName');
        const modalProject = document.getElementById("myModalProject");
        const btnProject = document.querySelector('.addProject');
        btnProject.addEventListener("click", (e) => {
            modalProject.style.display = "block";
            newProjectName.value = "";
        });
    });

    subscribe("renderButtonsSubmit", function () {
        function onTaskSend(newTask) {
            publish("addNewTask", newTask);
        }
        const projectNewTask = document.querySelector('.SelectProject');
        const modalTask = document.getElementById("myModalTask");
        const btnSubmitTask = document.querySelector('#submitTask');
        const textArea = document.querySelector('.textArea');
        btnSubmitTask.addEventListener("click", (e) => {
            let id = document.getElementById("taskId").value;
            let date = (document.getElementById("taskTime").value == "") ? null : document.getElementById("taskTime").value;
            let formatDate = (date == null) ? null : format(parse(date, 'yyyy-MM-dd', new Date()), 'dd/MM/yy');
            let idTask = (id == "") ? null : id;
            const newTask = new Task(idTask, textArea.value, formatDate, projectNewTask.value, false);
            modalTask.style.display = "none";
            onTaskSend(newTask);
        });

        function onProjectSend(newProject) {
            publish("addNewProject", newProject);
        }

        const modalProject = document.getElementById("myModalProject");
        const btnSubmitProject = document.querySelector('#submitProject');
        const newProjectName = document.querySelector('.newProjectName');
        btnSubmitProject.addEventListener("click", (e) => {
            let id = document.getElementById("projectId").value;
            let idProject = (id == "") ? null : id;
            const newProject = new Project(idProject, newProjectName.value);
            newProject.setIsSelected(false);
            modalProject.style.display = "none";
            onProjectSend(newProject);
        });
    });

    subscribe("renderCloseButtons", function (eventArgs) {
        window.onclick = function (event) {
            if (event.target.classList.contains("modal") || event.target.classList.contains("close")) {
                const modals = document.querySelectorAll(".modal");
                modals.forEach((modal) => {
                    modal.style.display = "none";
                });
            }
        }
    });

    subscribe("renderEditTask", function (taskToEdit) {
        const modalTask = document.getElementById("myModalTask");
        modalTask.style.display = "block";
        const projectNewTask = document.querySelector('.SelectProject');
        projectNewTask.value = taskToEdit.getProject();
        projectNewTask.disabled = true;
        const textArea = document.querySelector('.textArea');
        textArea.value = taskToEdit.getDescription();
        const idTaskDom = document.querySelector('#taskId');
        idTaskDom.value = taskToEdit.getId();
        const taskTime = document.querySelector('#taskTime');
        const formatDate = (taskToEdit.getTime() == null) ? "" : format(parse(taskToEdit.getTime(), 'dd/MM/yy', new Date()), 'yyyy-MM-dd');
        taskTime.value = formatDate;
    });

    subscribe("renderEditProject", function (project) {
        const modalProject = document.getElementById("myModalProject");
        modalProject.style.display = "block";
        const nameProject = document.querySelector('.newProjectName');
        nameProject.value = project.getName();
        const idProjectDom = document.querySelector('#projectId');
        idProjectDom.value = project.getId();
    });
})();

const mainController = (function () {
    subscribe("init", function (eventArgs) {
        publish("renderProjectView", projects);
        publish("renderButtonsView", projects);
        publish("renderButtonsSubmit");
        publish("renderCloseButtons");
        const countTasks = projects.reduce((sum, project) => sum + project.getTasks().filter(x => !x.getIsDone()).length, 0);
        publish("renderTaskCounter", countTasks);
    });
})();

publish("init");



