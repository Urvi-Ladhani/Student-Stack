import TaskCard from "../components/TaskCard";
import { useState, useEffect } from "react";

function Taskspage() {

    const savedTasks = localStorage.getItem("tasks");
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
                tasks.map((task) =>
                    <TaskCard id={task.id} title={task.title} priority={task.priority} deleteTask={deleteTask} completeTask={completeTask} completed={task.completed} />
                )
            }

            <input value={title} onChange={(event) => { setTitle(event.target.value) }} type="text" placeholder="enter title"></input>
            <input value={priority} onChange={(event) => { setPriority(event.target.value) }} type="text" placeholder="enter priority"></input>
            <button onClick={addtask}>ADD TASK</button>

        </>
    );
}
export default Taskspage