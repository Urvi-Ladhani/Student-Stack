import TaskCard from "../components/TaskCard";
import { useState } from "react";

function Taskspage() {
    const [tasks,setTasks] = useState([
        {
            id: 1,
            title: "Learn React Components",
            priority: "High"
        },
        {
            id: 2,
            title: "Solve 5 Array Problems",
            priority: "Medium"
        },
        {
            id: 3,
            title: "Update Resume",
            priority: "Low"
        }
    ]);

    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("");

    function addtask(){
        const newe={
            id : tasks.length+1,
            title: title,
            priority : priority
        }
        setTasks([...tasks,newe]);
        setTitle("");
        setPriority("");
    }

    function deleteTask(id){
        const newest= tasks.filter((task) => task.id!==id);
        setTasks(newest);
    }
    return (
        <>
            <h1>tasks page</h1>
            {
                tasks.map((task) =>
                    <TaskCard id={task.id}  title={task.title} priority={task.priority} deleteTask={deleteTask}/>
                )
            }
            
            <input value={title} onChange={(event)=> {setTitle(event.target.value)}}  type="text" placeholder="enter title"></input>
            <input  value={priority} onChange={(event)=> {setPriority(event.target.value)}}  type="text" placeholder="enter priority"></input>
            <button onClick={addtask}>ADD TASK</button>
            
        </>
    );
}
export default Taskspage