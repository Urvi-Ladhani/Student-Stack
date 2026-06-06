import TaskCard from "../components/TaskCard";
import { useState, useEffect } from "react";

function Taskspage() {

    const savedTasks = localStorage.getItem("tasks");
    const [editingId, setEditingId] = useState(null);
    const [tasks, setTasks] = useState(savedTasks
        ? JSON.parse(savedTasks)
        : [
            {
                id: 1,
                title: "Learn React Components",
                priority: "High",
                description: "Build reusable React components and understand how props are used to pass data between them.",
                category: "Learning",
                deadline: "2026-06-15",
                completed: false
            },
            {
                id: 2,
                title: "Solve 5 Array Problems",
                description: "Practice array-based coding problems to improve logic building and problem-solving skills.",
                priority: "Medium",
                category: "DSA",
                deadline: "2026-06-18",
                completed: false
            },
            {
                id: 3,
                title: "Update Resume",
                description: "Add recent projects, technical skills, and achievements to keep the resume interview-ready.",
                priority: "Low",
                category: "Internship",
                deadline: "2026-06-20",
                completed: false
            }
        ]
    );

    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("");
    const [filter, setFilter] = useState("all");
    const [description, setDescription] = useState("");
    const [deadline, setDeadline] = useState("");
    const [category, setCategory] = useState("Learning");
    const [search,setSearch]=useState("");

    function addtask() {
        const newe = {
            id: tasks.length + 1,
            title: title,
            description: description,
            priority: priority,
            deadline: deadline,
            category: category,
            completed: false
        }
        setTasks([...tasks, newe]);
        setTitle("");
        setPriority("");
        setDescription("");
        setDeadline("");
    }

    function deleteTask(id) {
        const newest = tasks.filter((task) => task.id !== id);
        setTasks(newest);
    }

    function completeTask(id) {
        const tasksleft = tasks.map((task) => {
            if (task.id === id) {
                return {
                    ...task,
                    completed: !task.completed
                }
            }
            else {
                return task;
            }
        });
        setTasks(tasksleft);
    }
    let filteredTasks = tasks;
    function allTasks() {
        setFilter("all");
    }

    function completedTasks() {
        setFilter("completed");
    }

    function pendingTasks() {
        setFilter("pending");
    }

    if (filter === "completed") {
        filteredTasks = tasks.filter((task) => {
            return task.completed === true;
        });
    }

    if (filter === "pending") {
        filteredTasks = tasks.filter((task) => {
            return task.completed === false;
        });
    }
    let searchTasks=filteredTasks;
        searchTasks = filteredTasks.filter((task) => {
            return task.title.toLowerCase().includes(search.toLowerCase()) || task.description.toLowerCase().includes(search.toLowerCase()) || task.category.toLowerCase().includes(search.toLowerCase());
    });
    

    function editTask(id) {
        setEditingId(id);
        const taskToEdit = tasks.find((task) => task.id === id);
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description);
        setDeadline(taskToEdit.deadline);
        setCategory(taskToEdit.category);
        setPriority(taskToEdit.priority);

    }
    function updateTask() {
        const updatedTasks = tasks.map((task) => {
            if (task.id === editingId) {
                return {
                    ...task,
                    title: title,
                    description: description,
                    deadline: deadline,
                    category: category,
                    priority: priority
                };
            }
            return task;
        });
        setTasks(updatedTasks);
        setPriority("");
        setTitle("");
        setDescription("");
        setEditingId(null);
        setDeadline("");
        setCategory("");
    }

    const totalTasks=tasks.length;
    const comTasks=tasks.filter((task) => {
            return task.completed === true;
        });
    const completedLen=comTasks.length;
    const pendingTaskLen=Number(totalTasks-completedLen);

    useEffect(() => {
        localStorage.setItem(
            "tasks",
            JSON.stringify(tasks)
        );
    }, [tasks]);
    return (
        <>
            <h1>tasks page</h1>
            {
                searchTasks.map((task) =>
                    <TaskCard id={task.id} title={task.title} description={task.description} priority={task.priority} deleteTask={deleteTask} completeTask={completeTask} completed={task.completed} editTask={editTask} deadline={task.deadline} category={task.category} />
                )
            }

            <input value={title} onChange={(event) => { setTitle(event.target.value) }} type="text" placeholder="enter title"></input>
            <textarea value={description} onChange={(event) => { setDescription(event.target.value) }} type="text" placeholder="enter description"></textarea>
            <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
            >
                <option value="Learning">Learning</option>
                <option value="DSA">DSA</option>
                <option value="College">College</option>
                <option value="Internship">Internship</option>
                <option value="Project">Project</option>
                <option value="Personal">Personal</option>
            </select>
            <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            <input value={priority} onChange={(event) => { setPriority(event.target.value) }} type="text" placeholder="enter priority"></input>
            <button onClick={editingId === null ? addtask : updateTask}>{editingId === null ? "ADD TASK" : "UPDATE TASK"}</button>

            <p>filtering</p>
            <button onClick={allTasks}>SHOW ALL</button>
            <button onClick={completedTasks}>SHOW COMPLETED</button>
            <button onClick={pendingTasks}>SHOW PENDING</button>
            
            <p>{filter}</p>

            <input value={search} onChange={(event) => { setSearch(event.target.value) }} type="text" placeholder="search"></input>
            <p>statistics:</p>
            <p>Total Tasks:{totalTasks}</p>
            <p>Completed Tasks:{completedLen}</p>
            <p>Pending Tasks:{pendingTaskLen}</p>
            
        </>
    );
}
export default Taskspage