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
                completed: false
            },
            {
                id: 2,
                title: "Solve 5 Array Problems",
                priority: "Medium",
                completed: false
            },
            {
                id: 3,
                title: "Update Resume",
                priority: "Low",
                completed: false
            }
        ]
    );

    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("");
    const [filter, setFilter] = useState("all");

    function addtask() {
        const newe = {
            id: tasks.length + 1,
            title: title,
            priority: priority,
            completed: false
        }
        setTasks([...tasks, newe]);
        setTitle("");
        setPriority("");
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

    function editTask(id) {
        setEditingId(id);
        const taskToEdit = tasks.find((task) => task.id === id);
        setTitle(taskToEdit.title);
        setPriority(taskToEdit.priority);

    }
    function updateTask() {
        const updatedTasks = tasks.map((task) => {
            if (task.id === editingId) {
                return {
                    ...task,
                    title: title,
                    priority: priority
            };
            }
            return task;
        });
        setTasks(updatedTasks);
        setPriority("");
        setTitle("");
        setEditingId(null);
    }
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
                filteredTasks.map((task) =>
                    <TaskCard id={task.id} title={task.title} priority={task.priority} deleteTask={deleteTask} completeTask={completeTask} completed={task.completed} editTask={editTask} />
                )
            }

            <input value={title} onChange={(event) => { setTitle(event.target.value) }} type="text" placeholder="enter title"></input>
            <input value={priority} onChange={(event) => { setPriority(event.target.value) }} type="text" placeholder="enter priority"></input>
            <button onClick={editingId === null ? addtask : updateTask}>{editingId === null ? "ADD TASK" : "UPDATE TASK"}</button>

            <p>filtering</p>
            <button onClick={allTasks}>SHOW ALL</button>
            <button onClick={completedTasks}>SHOW COMPLETED</button>
            <button onClick={pendingTasks}>SHOW PENDING</button>
            <p>{filter}</p>

        </>
    );
}
export default Taskspage