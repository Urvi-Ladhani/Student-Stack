function TaskCard(props){
    return (
        <div>
            <h3>Title:{props.title}</h3>
            <p>Priority:{props.priority}</p>
            <p>Task Id:{props.id}</p>
            <button onClick={() =>{props.deleteTask(props.id)}}>DELETE</button>
        </div>
    );
}

export default TaskCard