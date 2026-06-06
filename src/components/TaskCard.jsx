function TaskCard(props){
    return (
        <div>
            <p>Task Id:{props.id}</p>
            <h3>Title:{props.title}</h3>
            <p>Description:{props.description}</p>
            <p>Category: {props.category}</p>
            <p>Deadline: {props.deadline}</p>
            <p>Priority:{props.priority}</p>
            <p>{props.overdue ? "OVERDUE" : "UPCOMING"}</p>
            
            <button onClick={() =>{props.deleteTask(props.id)}}>DELETE</button>
            <button onClick={()=> {props.completeTask(props.id)}}>{props.completed ? "UNDO" : "COMPLETE"}</button>
            <button onClick={() =>{props.editTask(props.id)}}>EDIT</button>
            <p>{props.completed ? "Completed" : "Pending"}</p>
        </div>
    );
}

export default TaskCard