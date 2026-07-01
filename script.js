document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const emptyImage = document.querySelector('.empty-image');
    const todosContainer = document.querySelector('.todos-container');
    const progressBar = document.getElementById('progress');
    const progressNumbers = document.getElementById('numbers');
    let listWasComplete = false;
    let confettiFired = false;

    const firebaseConfig = {
        apiKey: "AIzaSyAKzZKgxgBihc5tBNYHPTeUcnx3l56NQM0",
        authDomain: "to-do-list-4bfad.firebaseapp.com",
        projectId: "to-do-list-4bfad",
        storageBucket: "to-do-list-4bfad.firebasestorage.app",
        messagingSenderId: "959625889421",
        appId: "1:959625889421:web:210cf12ab38b5bc7e904c4",
        measurementId: "G-X33VL99B00"
    };

    const getUserId = () => {
        let id = localStorage.getItem('todoUserId');
        if (!id) {
            id = prompt('Digite um ID de usuário para sincronizar suas tarefas entre dispositivos:')?.trim();
            if (id) {
                localStorage.setItem('todoUserId', id);
            }
        }
        return id;
    };

    const userId = getUserId();
    const firestoreEnabled = Boolean(userId);
    let tasksDoc = null;

    if (firestoreEnabled) {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        tasksDoc = db.collection('todos').doc(userId);
    }

    const toggleEmptyState = () => {
        emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
        todosContainer.style.width = taskList.children.length > 0 ? '100%' : '50%'
    }

    const updateProgress = (checkCompletion = true) => {
        const totalTasks = taskList.children.length;
        const completedTasks = taskList.querySelectorAll('.checkbox:checked').length;
        const listIsComplete = totalTasks > 0 && completedTasks === totalTasks;

        progressBar.style.width = totalTasks ? `${(completedTasks / totalTasks) * 100}%` : '0%';
        progressNumbers.textContent = `${completedTasks} / ${totalTasks}`;

        if (checkCompletion && listIsComplete && !listWasComplete && !confettiFired) {
            Confetti();
            confettiFired = true;
        }

        if (!listIsComplete) {
            confettiFired = false;
        }

        listWasComplete = listIsComplete;
    };

    const saveTasksToFirestore = async (tasks) => {
        if (!firestoreEnabled || !tasksDoc) return;
        try {
            await tasksDoc.set({
                tasks,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao salvar no Firebase:', error);
        }
    };

    const saveTasks = (tasks) => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        saveTasksToFirestore(tasks);
    };

    const saveTaskList = () => {
        const tasks = Array.from(taskList.querySelectorAll('li')).map(li => ({
            text: li.querySelector('span').textContent,
            completed: li.querySelector('.checkbox').checked
        }));
        saveTasks(tasks);
    };

    const loadTasksFromLocalStorage = async () => {
        let savedTasks = [];

        if (firestoreEnabled && tasksDoc) {
            try {
                const doc = await tasksDoc.get();
                if (doc.exists) {
                    savedTasks = doc.data().tasks || [];
                } else {
                    savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                }
            } catch (error) {
                console.error('Erro ao carregar do Firebase:', error);
                savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            }
        } else {
            savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        }

        savedTasks.forEach(({ text, completed }) => addTask(text, completed, false));
        toggleEmptyState();
        updateProgress(false);
    };

    const addTask = (text, completed = false, save = true) => {
        const taskText = text || taskInput.value.trim();
        if (!taskText) {
            return;
        }

        const li = document.createElement('li');
        li.innerHTML = `
        <input type="checkbox" class="checkbox" ${completed ? 'checked' : ''} />
        <span>${taskText}</span>
        <div class="task-butons">
        <button class="edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
        </div>
        `;

        const checkbox = li.querySelector('.checkbox');
        const editBtn = li.querySelector('.edit-btn');

        if (completed) {
            li.classList.add('completed');
            editBtn.disabled = true;
            editBtn.style.opacity = '0.5';
            editBtn.style.pointerEvents = 'none';
        }

        checkbox.addEventListener('change', () => {
            const isChecked = checkbox.checked;

            li.classList.toggle('completed', isChecked);
            editBtn.disabled = isChecked;
            editBtn.style.opacity = isChecked ? '0.5' : '1';
            editBtn.style.pointerEvents = isChecked ? 'none' : 'auto';
            updateProgress(true);
            saveTaskList();
        });

        editBtn.addEventListener('click', () => {
            if (!checkbox.checked) {
                taskInput.value = li.querySelector('span').textContent;
                li.remove();
                toggleEmptyState();
                updateProgress(false);
                saveTaskList();
            }
        });

        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            toggleEmptyState();
            updateProgress(false);
            saveTaskList();
        });

        taskList.appendChild(li);
        taskInput.value = '';
        toggleEmptyState();
        updateProgress(false);
        if (save) {
            saveTaskList();
        }
    };
    addTaskBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addTask();
    });
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });

    loadTasksFromLocalStorage()

});

const Confetti = () => {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
};